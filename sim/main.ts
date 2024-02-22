namespace pxsim.radioMesh {
    export function raiseEvent(id: number, eventid: number): void {
        const state = pxsim.getRadioMeshState();
        state.raiseEvent(id, eventid);
    }

    export function setGroup(id: number): void {
        const state = pxsim.getRadioMeshState();
        state.setGroup(id);
    }

    export function setTransmitPower(power: number): void {
        const state = pxsim.getRadioMeshState();
        state.setTransmitPower(power);
    }

    export function setFrequencyBand(band: number) { 
        const state = pxsim.getRadioMeshState();
        state.setFrequencyBand(band);
    }

    export function sendRawPacket(buf: RefBuffer) {
        let cb = getResume();
        const state = pxsim.getRadioMeshState();
        if (state.enable) {
            state.datagram.send({
                type: 0,
                groupId: state.groupId,
                bufferData: buf.data
            });
        }
        setTimeout(cb, 1);
    }

    export function readRawPacket() {
        const state = pxsim.getRadioMeshState();
        const packet = state.datagram.recv();
        const buf = packet.payload.bufferData;
        const n = buf.length;
        if (!n)
            return undefined;

        const rbuf = BufferMethods.createBuffer(n + 4);
        for(let i = 0; i < buf.length; ++i)
            rbuf.data[i] = buf[i];
        // append RSSI
        BufferMethods.setNumber(rbuf, BufferMethods.NumberFormat.Int32LE, n, packet.rssi)
        return rbuf;
    }

    export function onDataReceived(handler: RefAction): void {
        const state = pxsim.getRadioMeshState();
        state.datagram.onReceived(handler);
    }

    export function off(){
        const state = pxsim.getRadioMeshState();
        state.off();
    }

    export function on(){
        const state = pxsim.getRadioMeshState();
        state.on();
    }

}