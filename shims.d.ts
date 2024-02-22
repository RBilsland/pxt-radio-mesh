// Auto-generated. Do not edit.



    //% color=#E3008C weight=96 icon="\uf012"
declare namespace radioMesh {

    /**
     * Disables the radio for use as a multipoint sender/receiver.
     * Disabling radio will help conserve battery power when it is not in use.
     */
    //% help=radioMesh/off shim=radioMesh::off
    function off(): void;

    /**
     * Initialises the radio for use as a multipoint sender/receiver
     * Only useful when the radio.off() is used beforehand.
     */
    //% help=radioMesh/on shim=radioMesh::on
    function on(): void;

    /**
     * Sends an event over radio to neigboring devices
     */
    //% blockId=radioMeshRaiseEvent block="radio raise event|from source %src=control_event_source_id|with value %value=control_event_value_id"
    //% blockExternalInputs=1
    //% advanced=true
    //% weight=1
    //% help=radioMesh/raise-event shim=radioMesh::raiseEvent
    function raiseEvent(src: int32, value: int32): void;

    /**
     * Internal use only. Takes the next packet from the radio queue and returns its contents + RSSI in a Buffer.
     * @returns NULL if no packet available
     */
    //% shim=radioMesh::readRawPacket
    function readRawPacket(): Buffer;

    /**
     * Internal use only. Sends a raw packet through the radio (assumes RSSI appened to packet)
     */
    //% async shim=radioMesh::sendRawPacket
    function sendRawPacket(msg: Buffer): void;

    /**
     * Used internally by the library.
     */
    //% help=radioMesh/on-data-received
    //% weight=0
    //% blockId=radio_mesh_datagram_received_event block="radio on data received" blockGap=8
    //% deprecated=true blockHidden=1 shim=radioMesh::onDataReceived
    function onDataReceived(body: () => void): void;

    /**
     * Sets the group id for radio communications. A micro:bit can only listen to one group ID at any time.
     * @param id the group id between ``0`` and ``255``, eg: 1
     */
    //% help=radioMesh/set-group
    //% weight=100
    //% blockId=radio_mesh_set_group block="radio set group %ID"
    //% id.min=0 id.max=255
    //% group="Group" shim=radioMesh::setGroup
    function setGroup(id: int32): void;

    /**
     * Change the output power level of the transmitter to the given value.
     * @param power a value in the range 0..7, where 0 is the lowest power and 7 is the highest. eg: 7
     */
    //% help=radioMesh/set-transmit-power
    //% weight=9 blockGap=8
    //% blockId=radio_mesh_set_transmit_power block="radio set transmit power %power"
    //% power.min=0 power.max=7
    //% advanced=true shim=radioMesh::setTransmitPower
    function setTransmitPower(power: int32): void;

    /**
     * Change the transmission and reception band of the radio to the given channel
     * @param band a frequency band in the range 0 - 83. Each step is 1MHz wide, based at 2400MHz.
     **/
    //% help=radioMesh/set-frequency-band
    //% weight=8 blockGap=8
    //% blockId=radio_mesh_set_frequency_band block="radio set frequency band %band"
    //% band.min=0 band.max=83
    //% advanced=true shim=radioMesh::setFrequencyBand
    function setFrequencyBand(band: int32): void;
}

// Auto-generated. Do not edit. Really.
