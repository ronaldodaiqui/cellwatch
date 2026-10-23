# SMB Link BLE protocol (reverse-engineered)

Source: SMB Link Android app (uni-app / Vue 3, `__UNI__07361A3`), logic in `assets/apps/__UNI__07361A3/www/app-service.js`.

The app supports two BMS families. It picks one from the BLE device name:
**15 characters → "山木" Shanmu (Mottcell's own BMS, type 1)**, 16 characters → "沛城" Pace (type 2).
Both are Modbus RTU function 0x03 (read holding registers) carried over BLE. Registers are big-endian u16.
The CRC is standard Modbus CRC-16 (poly 0xA001, init 0xFFFF, low byte first).

## Type 1: Shanmu / Mottcell

- **Advertises** service `0000FFFA-…`. Use the characteristic in that service with `notify` for RX and the one with `write` for TX. A single characteristic may have both.
- **Request** = `A5 A5` + Modbus frame. The CRC covers only the Modbus part (from `01`):
  ```
  A5 A5 01 03 00 00 00 35 85 DD   live block   (0x0000, 53 regs)
  A5 A5 01 03 00 3C 00 40 84 36   settings     (0x003C, 64 regs)
  A5 A5 01 03 00 96 00 30 A5 F2   info strings (0x0096, 48 regs)
  A5 A5 01 03 00 C3 00 20 B4 2E   protocol ver (0x00C3, 32 regs)
  ```
  The app sends all four 400 ms apart and repeats about every 2 s. It sets MTU to 200 on Android.
- **Response** = `A5 A5 01 03 <bytecount> <data…> <crc lo> <crc hi>`. The app identifies each block by its byte count: 0x6A, 0x80, 0x60, 0x40.

### Live block (start 0x0000)

| Reg | Meaning | Scale |
|---|---|---|
| 0–1 | Current, int32 (reg 0 = high word) | 0.01 A, + = charging |
| 2–3 | Pack voltage, uint32 | 0.01 V |
| 4 | SOC | % |
| 12 | Cycle count | |
| 14 | Alarm bits (below) | |
| 15 | Protection bits (below) | |
| 16 | Status: bit 9 charge FET on, bit 10 discharge FET on, bit 15 heater on; bits 0,1,2,4,5 faults | |
| 19 | Cell count | |
| 20–39 | Cell voltages (0xFFFF = unused) | mV |
| 40 | Temperature sensor count | |
| 41–50 | Temperatures (0xFFFF = unused) | (x − 2730) / 10 °C |
| 51 | MOSFET temperature | (x − 2730) / 10 °C |
| 5–11, 13, 17, 18, 52 | Read but not used by the app (capacity is probably in here) | ? |

**Alarm bits (reg 14):** 0 cell OV, 1 cell UV, 2 pack OV, 3 pack UV, 4 charge OC, 5 discharge OC, 8 charge high temp, 9 discharge high temp, 10 charge low temp, 11 discharge low temp, 12 ambient high temp, 13 ambient low temp, 14 MOSFET high temp, 15 low SOC.

**Protection bits (reg 15):** 0 cell OV, 1 cell UV, 2 pack OV, 3 pack UV, 4 charge OC, 5 discharge OC, 6 short circuit, 7 charger OV, 8 charge high temp, 9 discharge high temp, 10 charge low temp, 11 discharge low temp, 12 MOSFET high temp, 13 ambient high temp, 14 ambient low temp.

**Fault bits (reg 16):** 0 charge MOSFET, 1 discharge MOSFET, 2 temperature sensor, 4 cell, 5 front-end sampling comms.

### Settings block (start 0x003C)
Voltages are in mV (some are uint32 across two registers), currents in A, delays in 0.1 s unless noted, and temperatures as (x − 2730)/10 °C.
- 0x3C/3E/40: pack OV alarm / protect / release (u32 mV); 0x42 delay
- 0x43–0x46: cell OV alarm / protect / release / delay
- 0x47/49/4B: pack UV alarm / protect / release (u32 mV); 0x4D delay
- 0x4E–0x51: cell UV alarm / protect / release / delay
- 0x52–0x54: charge OC alarm / protect (A) / delay; 0x55–0x57: discharge OC alarm / protect / delay; 0x58 discharge OC2 (A), 0x59 delay (×25 ms)
- 0x5A–0x6E: temperature thresholds, in groups of alarm / protect / release: charge-high, discharge-high, charge-low, discharge-low, MOSFET-high, ambient-high, ambient-low
- 0x6F balance start (mV), 0x70 balance delta (mV), 0x71 charge cut-off V (u32 mV), 0x73 cut-off current (mA), 0x74 sleep V (mV), 0x75 sleep delay (min), 0x76 short-circuit delay (×25 µs), 0x77 low-SOC alarm (%), 0x78 charge OC2 (A), 0x79 delay (×25 ms)

### Info blocks
- 0x0096: ASCII. Bytes 0–29 version, 30–59 model SN, 60–89 pack SN.
- 0x00C3: ASCII. Bytes 0–9 protocol version.

### Writes (not used by Cellwatch)
1. Send the password: `A5 A5 01 10 00 D2 00 05 0A 33 44 <8 ASCII password bytes> <crc>`. The CRC covers from `01`.
2. Send function 0x10 writes as `A5 A5 01 10 <addr> <qty> <bytecount> <value> <crc>`.

A reply with bytes [2..3] = `00 10` means success.

### Firmware update
A separate service, `11110001-1111-…`, with characteristics `…0002` (data) and `…0003` (control). Leave it alone.

## Type 2: Pace

Cross-checked against Pace's official **"PACE BMS Modbus Protocol for RS485 V1.3" (2017)**. That spec matches this battery for registers 0–14:
- 9 warnings, 10 protections, 11 status/faults, **12 "Balance status"** (the spec gives no bit definitions), 13–14 reserved.
- It does **not** match after register 14. V1.3 puts cells at 15–30 with no count register and starts the settings at 60, while this battery uses SMB Link's layout below. So this is a later Pace Modbus variant, and V1.3 is only trusted where the data agree.
- V1.3 status bits that SMB Link doesn't use: 8 charging state, 9 discharging state, 12 charge limiter, 13 reserved (SMB Link calls it "Acin"), 14 charger reversed. Protection bit 15 and warning bits 6–7 are reserved in V1.3. SMB Link also drops protection bit 15.
- Balancing: V1.3 and SMB Link both expose only the start voltage and start difference (here settings regs 128–129). Neither has an enable switch, balancing current, or inhibit reason.


Plain Modbus (no prefix). The service is whichever one has notify + write characteristics; the app writes to the *last* characteristic.
Requests: `01 03 00 00 00 3B`, `01 03 00 53 00 37`, `01 03 00 AA 00 23` (+ CRC). Slave address 1, function 0x03 only.
Live: reg 0 current (int16, 10 mA), 1 voltage (10 mV), 2 SOC, 7 cycles, 9 alarms, 10 protections, 11 status, 15 cell count, 16–45 cells (mV, 30 slots), 46 temp count, 47–56 temps (int16, 0.1 °C), 57 MOSFET temp. Alarm and protection bits use the same tables as Shanmu (SMB Link uses one table for both).
Status reg 11, per SMB Link's hidden status panel: bit 10 charge MOSFET, bit 11 discharge MOSFET, bit 13 "Acin" (meaning undocumented), bit 15 heater, bits 0/1/2/4/5 faults (same as Shanmu). The panel also has labels for "charging limiter" and "reverse connection" but never maps them to a bit; bits 8, 9, 12 and 14 are unlabelled.
SMB Link reads only the three blocks above. Registers 0x3B–0x52 and anything past 0xCC are never read.
Observed on a 300 Ah 4S pack: reg 8 = 0, reg 12 = 0, reg 13 = 0, reg 14 = 0xC000, reg 58 = 0xFFFF (all undocumented).
The public Pace map also puts SOH in reg 3 and remaining / full / design capacity in regs 4/5/6 (10 mAh units); SMB Link doesn't display these.
