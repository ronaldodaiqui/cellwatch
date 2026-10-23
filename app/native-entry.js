// Native plugins for the Android app, bundled into www/native.js by build-web.mjs.
import { BleClient } from '@capacitor-community/bluetooth-le';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
window.BleClient = BleClient;
window.Native = { Filesystem, Directory, Encoding, Share };
