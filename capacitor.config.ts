import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ae.alafreet.family",
  appName: "ALAFREET",
  webDir: "native-shell",
  server: {
    url: "https://www.alafreet.ae/v9/home",
    cleartext: false,
    allowNavigation: ["www.alafreet.ae", "alafreet.ae"],
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    backgroundColor: "#02030a",
    scrollEnabled: true,
  },
};

export default config;
