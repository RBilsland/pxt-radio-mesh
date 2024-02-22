enum RadioMeshPacketProperty {
    //% blockIdentity=radioMesh._packetProperty
    //% block="signal strength"
    SignalStrength = 2,
    //% blockIdentity=radioMesh._packetProperty
    //% block="time"
    Time = 0,
    //% block="serial number"
    //% blockIdentity=radioMesh._packetProperty
    SerialNumber = 1
}

/**
 * Communicate data using radio packets
 */
//% color=#E3008C weight=96 icon="\uf012" groups='["Group", "Broadcast", "Send", "Receive"]'
namespace radioMesh {

    // keep in sync with CODAL
    const RADIO_MAX_PACKET_SIZE = 32;
    const MAX_FIELD_DOUBLE_NAME_LENGTH = 8;
    const MAX_PAYLOAD_LENGTH = 20;
    const PACKET_PREFIX_LENGTH = 9;
    const VALUE_PACKET_NAME_LEN_OFFSET = 13;
    const DOUBLE_VALUE_PACKET_NAME_LEN_OFFSET = 17;

    // Packet Spec:
    // | 0              | 1 ... 4       | 5 ... 8           | 9 ... 28
    // ----------------------------------------------------------------
    // | packet type    | system time   | serial number     | payload
    //
    // Serial number defaults to 0 unless enabled by user

    // payload: number (9 ... 12)
    export const PACKET_TYPE_NUMBER = 0;
    // payload: number (9 ... 12), name length (13), name (14 ... 26)
    export const PACKET_TYPE_VALUE = 1;
    // payload: string length (9), string (10 ... 28)
    export const PACKET_TYPE_STRING = 2;
    // payload: buffer length (9), buffer (10 ... 28)
    export const PACKET_TYPE_BUFFER = 3;
    // payload: number (9 ... 16)
    export const PACKET_TYPE_DOUBLE = 4;
    // payload: number (9 ... 16), name length (17), name (18 ... 26)
    export const PACKET_TYPE_DOUBLE_VALUE = 5;

    let transmittingSerial: boolean;
    let initialized = false;

    export let lastPacket: RadioPacket;
    let onReceivedNumberHandler: (receivedNumber: number) => void;
    let onReceivedValueHandler: (name: string, value: number) => void;
    let onReceivedStringHandler: (receivedString: string) => void;
    let onReceivedBufferHandler: (receivedBuffer: Buffer) => void;

    function init() {
        if (initialized) return;
        initialized = true;
        onDataReceived(handleDataReceived);
    }

    function handleDataReceived() {
        let buffer: Buffer = readRawPacket();
        while (buffer) {
            lastPacket = RadioPacket.getPacket(buffer);
            switch (lastPacket.packetType) {
                case PACKET_TYPE_NUMBER:
                case PACKET_TYPE_DOUBLE:
                    if (onReceivedNumberHandler)
                        onReceivedNumberHandler(lastPacket.numberPayload);
                    break;
                case PACKET_TYPE_VALUE:
                case PACKET_TYPE_DOUBLE_VALUE:
                    if (onReceivedValueHandler)
                        onReceivedValueHandler(lastPacket.stringPayload, lastPacket.numberPayload);
                    break;
                case PACKET_TYPE_BUFFER:
                    if (onReceivedBufferHandler)
                        onReceivedBufferHandler(lastPacket.bufferPayload);
                    break;
                case PACKET_TYPE_STRING:
                    if (onReceivedStringHandler)
                        onReceivedStringHandler(lastPacket.stringPayload);
                    break;
            }
            // read next packet if any
            buffer = readRawPacket();
        }
    }

    /**
     * Registers code to run when the radio receives a number.
     */
    //% help=radioMesh/on-received-number
    //% blockId=radio_mesh_on_number_drag block="on radio received" blockGap=16
    //% useLoc="radioMesh.onDataPacketReceived" draggableParameters=reporter
    //% group="Receive"
    //% weight=20
    export function onReceivedNumber(cb: (receivedNumber: number) => void) {
        init();
        onReceivedNumberHandler = cb;
    }

    /**
     * Registers code to run when the radio receives a key value pair.
     */
    //% help=radioMesh/on-received-value
    //% blockId=radio_mesh_on_value_drag block="on radio received" blockGap=16
    //% useLoc="radioMesh.onDataPacketReceived" draggableParameters=reporter
    //% group="Receive"
    //% weight=19
    export function onReceivedValue(cb: (name: string, value: number) => void) {
        init();
        onReceivedValueHandler = cb;
    }

    /**
     * Registers code to run when the radio receives a string.
     */
    //% help=radioMesh/on-received-string
    //% blockId=radio_mesh_on_string_drag block="on radio received" blockGap=16
    //% useLoc="radioMesh.onDataPacketReceived" draggableParameters=reporter
    //% group="Receive"
    //% weight=18
    export function onReceivedString(cb: (receivedString: string) => void) {
        init();
        onReceivedStringHandler = cb;
    }

    /**
     * Registers code to run when the radio receives a buffer.
     */
    //% help=radioMesh/on-received-buffer blockHidden=1
    //% blockId=radio_mesh_on_buffer_drag block="on radio received" blockGap=16
    //% useLoc="radioMesh.onDataPacketReceived" draggableParameters=reporter
    export function onReceivedBuffer(cb: (receivedBuffer: Buffer) => void) {
        init();
        onReceivedBufferHandler = cb;
    }

    /**
     * Returns properties of the last radio packet received.
     * @param type the type of property to retrieve from the last packet
     */
    //% help=radioMesh/received-packet
    //% blockGap=8
    //% blockId=radio_mesh_received_packet block="received packet %type=radio_mesh_packet_property" blockGap=16
    //% group="Receive"
    //% weight=16
    export function receivedPacket(type: number) {
        if (lastPacket) {
            switch (type) {
                case RadioMeshPacketProperty.Time: return lastPacket.time;
                case RadioMeshPacketProperty.SerialNumber: return lastPacket.serial;
                case RadioMeshPacketProperty.SignalStrength: return lastPacket.signal;
            }
        }
        return 0;
    }

    /**
     * Gets a packet property.
     * @param type the packet property type, eg: PacketProperty.time
     */
    //% blockId=radio_mesh_packet_property block="%note"
    //% shim=TD_ID blockHidden=1
    export function _packetProperty(type: RadioMeshPacketProperty): number {
        return type;
    }

    export class RadioPacket {
        public static getPacket(data: Buffer) {
            if (!data) return undefined;
            // last 4 bytes is RSSi
            return new RadioPacket(data);
        }

        public static mkPacket(packetType: number) {
            const res = new RadioPacket();
            res.data[0] = packetType;
            return res;
        }

        private constructor(public readonly data?: Buffer) {
            if (!data) this.data = control.createBuffer(RADIO_MAX_PACKET_SIZE + 4);
        }

        get signal() {
            return this.data.getNumber(NumberFormat.Int32LE, this.data.length - 4);
        }

        get packetType() {
            return this.data[0];
        }

        get time() {
            return this.data.getNumber(NumberFormat.Int32LE, 1);
        }

        set time(val: number) {
            this.data.setNumber(NumberFormat.Int32LE, 1, val);
        }

        get serial() {
            return this.data.getNumber(NumberFormat.Int32LE, 5);
        }

        set serial(val: number) {
            this.data.setNumber(NumberFormat.Int32LE, 5, val);
        }

        get stringPayload() {
            const offset = getStringOffset(this.packetType) as number;
            return offset ? this.data.slice(offset + 1, this.data[offset]).toString() : undefined;
        }

        set stringPayload(val: string) {
            const offset = getStringOffset(this.packetType) as number;
            if (offset) {
                const buf = control.createBufferFromUTF8(truncateString(val, getMaxStringLength(this.packetType)));
                this.data[offset] = buf.length;
                this.data.write(offset + 1, buf);
            }
        }

        get numberPayload() {
            switch (this.packetType) {
                case PACKET_TYPE_NUMBER:
                case PACKET_TYPE_VALUE:
                    return this.data.getNumber(NumberFormat.Int32LE, PACKET_PREFIX_LENGTH);
                case PACKET_TYPE_DOUBLE:
                case PACKET_TYPE_DOUBLE_VALUE:
                    return this.data.getNumber(NumberFormat.Float64LE, PACKET_PREFIX_LENGTH);
            }
            return undefined;
        }

        set numberPayload(val: number) {
            switch (this.packetType) {
                case PACKET_TYPE_NUMBER:
                case PACKET_TYPE_VALUE:
                    this.data.setNumber(NumberFormat.Int32LE, PACKET_PREFIX_LENGTH, val);
                    break;
                case PACKET_TYPE_DOUBLE:
                case PACKET_TYPE_DOUBLE_VALUE:
                    this.data.setNumber(NumberFormat.Float64LE, PACKET_PREFIX_LENGTH, val);
                    break;
            }
        }

        get bufferPayload() {
            const len = this.data[PACKET_PREFIX_LENGTH];
            return this.data.slice(PACKET_PREFIX_LENGTH + 1, len);
        }

        set bufferPayload(b: Buffer) {
            const len = Math.min(b.length, MAX_PAYLOAD_LENGTH - 1);
            this.data[PACKET_PREFIX_LENGTH] = len;
            this.data.write(PACKET_PREFIX_LENGTH + 1, b.slice(0, len));
        }

        hasString() {
            return this.packetType === PACKET_TYPE_STRING ||
                this.packetType === PACKET_TYPE_VALUE ||
                this.packetType === PACKET_TYPE_DOUBLE_VALUE;
        }

        hasNumber() {
            return this.packetType === PACKET_TYPE_NUMBER ||
                this.packetType === PACKET_TYPE_DOUBLE ||
                this.packetType === PACKET_TYPE_VALUE ||
                this.packetType === PACKET_TYPE_DOUBLE_VALUE;
        }
    }

    /**
     * Broadcasts a number over radio to any connected micro:bit in the group.
     */
    //% help=radioMesh/send-number
    //% weight=60
    //% blockId=radio_mesh_datagram_send block="radio send number %value" blockGap=8
    //% group="Send"
    export function sendNumber(value: number) {
        let packet: RadioPacket;

        if (value === (value | 0)) {
            packet = RadioPacket.mkPacket(PACKET_TYPE_NUMBER);
        }
        else {
            packet = RadioPacket.mkPacket(PACKET_TYPE_DOUBLE);
        }

        packet.numberPayload = value;
        sendPacket(packet);
    }

    /**
    * Broadcasts a name / value pair along with the device serial number
    * and running time to any connected micro:bit in the group. The name can
    * include no more than 8 characters.
    * @param name the field name (max 8 characters), eg: "name"
    * @param value the numeric value
    */
    //% help=radioMesh/send-value
    //% weight=59
    //% blockId=radio_mesh_datagram_send_value block="radio send|value %name|= %value" blockGap=8
    //% group="Send"
    export function sendValue(name: string, value: number) {
        let packet: RadioPacket;

        if (value === (value | 0)) {
            packet = RadioPacket.mkPacket(PACKET_TYPE_VALUE);
        }
        else {
            packet = RadioPacket.mkPacket(PACKET_TYPE_DOUBLE_VALUE);
        }

        packet.numberPayload = value;
        packet.stringPayload = name;
        sendPacket(packet);
    }

    /**
     * Broadcasts a string along with the device serial number
     * and running time to any connected micro:bit in the group.
     */
    //% help=radioMesh/send-string
    //% weight=58
    //% blockId=radio_mesh_datagram_send_string block="radio send string %msg"
    //% msg.shadowOptions.toString=true
    //% group="Send"
    export function sendString(value: string) {
        const packet = RadioPacket.mkPacket(PACKET_TYPE_STRING);
        packet.stringPayload = value;
        sendPacket(packet);
    }

    /**
     * Broadcasts a buffer (up to 19 bytes long) along with the device serial number
     * and running time to any connected micro:bit in the group.
     */
    //% help=radioMesh/send-buffer
    //% weight=57
    //% advanced=true
    export function sendBuffer(msg: Buffer) {
        const packet = RadioPacket.mkPacket(PACKET_TYPE_BUFFER);
        packet.bufferPayload = msg;
        sendPacket(packet);
    }

    /**
    * Set the radio to transmit the serial number in each message.
    * @param transmit value indicating if the serial number is transmitted, eg: true
    */
    //% help=radioMesh/set-transmit-serial-number
    //% weight=8 blockGap=8
    //% blockId=radio_mesh_set_transmit_serial_number block="radio set transmit serial number %transmit"
    //% advanced=true
    export function setTransmitSerialNumber(transmit: boolean) {
        transmittingSerial = transmit;
    }

    function sendPacket(packet: RadioPacket) {
        packet.time = control.millis();
        packet.serial = transmittingSerial ? control.deviceSerialNumber() : 0;
        radio.sendRawPacket(packet.data);
    }

    function truncateString(str: string, bytes: number) {
        str = str.substr(0, bytes);
        let buff = control.createBufferFromUTF8(str);

        while (buff.length > bytes) {
            str = str.substr(0, str.length - 1);
            buff = control.createBufferFromUTF8(str);
        }

        return str;
    }

    function getStringOffset(packetType: number) {
        switch (packetType) {
            case PACKET_TYPE_STRING:
                return PACKET_PREFIX_LENGTH;
            case PACKET_TYPE_VALUE:
                return VALUE_PACKET_NAME_LEN_OFFSET;
            case PACKET_TYPE_DOUBLE_VALUE:
                return DOUBLE_VALUE_PACKET_NAME_LEN_OFFSET;
            default:
                return undefined;
        }
    }

    function getMaxStringLength(packetType: number) {
        switch (packetType) {
            case PACKET_TYPE_STRING:
                return MAX_PAYLOAD_LENGTH - 1;
            case PACKET_TYPE_VALUE:
            case PACKET_TYPE_DOUBLE_VALUE:
                return MAX_FIELD_DOUBLE_NAME_LENGTH;
            default:
                return undefined;
        }
    }
}