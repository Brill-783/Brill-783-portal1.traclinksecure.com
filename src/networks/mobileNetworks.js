const mobileNetworks = [
  // ==========================================
  // NORTH AFRICA
  // ==========================================
  { mcc: "603", mnc: "01", country: "Algeria", network: "Mobilis" },
  { mcc: "603", mnc: "02", country: "Algeria", network: "Djezzy" },
  { mcc: "603", mnc: "03", country: "Algeria", network: "Ooredoo" },
  { mcc: "602", mnc: "01", country: "Egypt", network: "Orange Egypt" },
  { mcc: "602", mnc: "02", country: "Egypt", network: "Vodafone Egypt" },
  { mcc: "602", mnc: "03", country: "Egypt", network: "Etisalat Egypt (e&)" },
  { mcc: "602", mnc: "04", country: "Egypt", network: "WE (Telecom Egypt)" },
  { mcc: "606", mnc: "00", country: "Libya", network: "Libyana" },
  { mcc: "606", mnc: "01", country: "Libya", network: "Al-Madar Al-Jadeed" },
  { mcc: "604", mnc: "00", country: "Morocco", network: "Maroc Telecom" },
  { mcc: "604", mnc: "01", country: "Morocco", network: "Orange Morocco" },
  { mcc: "604", mnc: "02", country: "Morocco", network: "Inwi" },
  { mcc: "605", mnc: "01", country: "Tunisia", network: "Orange Tunisie" },
  { mcc: "605", mnc: "02", country: "Tunisia", network: "Ooredoo Tunisia" },
  { mcc: "605", mnc: "03", country: "Tunisia", network: "Tunisie Telecom" },

  // ==========================================
  // WEST AFRICA
  // ==========================================
  { mcc: "616", mnc: "01", country: "Benin", network: "Libercom" },
  { mcc: "616", mnc: "02", country: "Benin", network: "Moov Africa" },
  { mcc: "616", mnc: "03", country: "Benin", network: "MTN Benin" },
  { mcc: "613", mnc: "01", country: "Burkina Faso", network: "Orange Burkina Faso" },
  { mcc: "613", mnc: "02", country: "Burkina Faso", network: "Moov Africa (Celtel)" },
  { mcc: "613", mnc: "03", country: "Burkina Faso", network: "Telecel Faso" },
  { mcc: "612", mnc: "03", country: "Côte d'Ivoire", network: "Orange Côte d'Ivoire" },
  { mcc: "612", mnc: "05", country: "Côte d'Ivoire", network: "MTN Côte d'Ivoire" },
  { mcc: "612", mnc: "06", country: "Côte d'Ivoire", network: "Moov Africa" },
  { mcc: "620", mnc: "01", country: "Ghana", network: "MTN Ghana" },
  { mcc: "620", mnc: "02", country: "Ghana", network: "Vodafone / Telecel Ghana" },
  { mcc: "620", mnc: "06", country: "Ghana", network: "AT Ghana (AirtelTigo)" },
  { mcc: "610", mnc: "01", country: "Mali", network: "Malitel (Moov)" },
  { mcc: "610", mnc: "02", country: "Mali", network: "Orange Mali" },
  { mcc: "610", mnc: "03", country: "Mali", network: "Telecel Mali" },
  { mcc: "621", mnc: "20", country: "Nigeria", network: "Airtel Nigeria" },
  { mcc: "621", mnc: "30", country: "Nigeria", network: "MTN Nigeria" },
  { mcc: "621", mnc: "50", country: "Nigeria", network: "Globacom (Glo Mobile)" },
  { mcc: "621", mnc: "60", country: "Nigeria", network: "9mobile" },
  { mcc: "608", mnc: "01", country: "Senegal", network: "Orange Senegal" },
  { mcc: "608", mnc: "02", country: "Senegal", network: "Free Senegal (Tigo)" },
  { mcc: "608", mnc: "03", country: "Senegal", network: "Expresso Telecom" },

  // ==========================================
  // EAST AFRICA
  // ==========================================
  { mcc: "636", mnc: "01", country: "Ethiopia", network: "Ethio Telecom" },
  { mcc: "636", mnc: "02", country: "Ethiopia", network: "Safaricom Ethiopia" },
  { mcc: "639", mnc: "02", country: "Kenya", network: "Safaricom" },
  { mcc: "639", mnc: "03", country: "Kenya", network: "Airtel Kenya" },
  { mcc: "639", mnc: "07", country: "Kenya", network: "Telkom Kenya" },
  { mcc: "635", mnc: "10", country: "Rwanda", network: "MTN Rwanda" },
  { mcc: "635", mnc: "14", country: "Rwanda", network: "Airtel Rwanda" },
  { mcc: "634", mnc: "01", country: "Sudan", network: "Zain Sudan" },
  { mcc: "634", mnc: "02", country: "Sudan", network: "MTN Sudan" },
  { mcc: "634", mnc: "15", country: "Sudan", network: "Sudani One" },
  { mcc: "640", mnc: "02", country: "Tanzania", network: "tigo Tanzania" },
  { mcc: "640", mnc: "04", country: "Tanzania", network: "Vodacom Tanzania" },
  { mcc: "640", mnc: "05", country: "Tanzania", network: "Airtel Tanzania" },
  { mcc: "640", mnc: "09", country: "Tanzania", network: "Halotel" },
  { mcc: "641", mnc: "01", country: "Uganda", network: "Airtel Uganda" },
  { mcc: "641", mnc: "10", country: "Uganda", network: "MTN Uganda" },
  { mcc: "641", mnc: "14", country: "Uganda", network: "Uganda Telecom (UTL)" },

  // ==========================================
  // CENTRAL AFRICA
  // ==========================================
  { mcc: "624", mnc: "01", country: "Cameroon", network: "MTN Cameroon" },
  { mcc: "624", mnc: "02", country: "Cameroon", network: "Orange Cameroun" },
  { mcc: "624", mnc: "03", country: "Cameroon", network: "Camtel" },
  { mcc: "624", mnc: "04", country: "Cameroon", network: "Nexttel" },
  { mcc: "622", mnc: "01", country: "Chad", network: "Airtel Chad" },
  { mcc: "622", mnc: "03", country: "Chad", network: "Moov Africa (Tigo)" },
  { mcc: "630", mnc: "01", country: "DR Congo", network: "Vodacom DRC" },
  { mcc: "630", mnc: "02", country: "DR Congo", network: "Airtel DRC" },
  { mcc: "630", mnc: "86", country: "DR Congo", network: "Orange RDC" },
  { mcc: "630", mnc: "89", country: "DR Congo", network: "Africell" },
  { mcc: "628", mnc: "01", country: "Gabon", network: "Libertis (Moov)" },
  { mcc: "628", mnc: "04", country: "Gabon", network: "Airtel Gabon" },

  // ==========================================
  // SOUTHERN AFRICA
  // ==========================================
  { mcc: "631", mnc: "02", country: "Angola", network: "Unitel" },
  { mcc: "631", mnc: "04", country: "Angola", network: "Movicel" },
  { mcc: "631", mnc: "05", country: "Angola", network: "Africell Angola" },
  { mcc: "652", mnc: "01", country: "Botswana", network: "Mascom" },
  { mcc: "652", mnc: "02", country: "Botswana", network: "Orange Botswana" },
  { mcc: "652", mnc: "04", country: "Botswana", network: "BTC Mobile" },
  { mcc: "646", mnc: "01", country: "Madagascar", network: "Airtel Madagascar" },
  { mcc: "646", mnc: "02", country: "Madagascar", network: "Orange Madagascar" },
  { mcc: "646", mnc: "04", country: "Madagascar", network: "Telma" },
  { mcc: "650", mnc: "01", country: "Malawi", network: "TNM" },
  { mcc: "650", mnc: "10", country: "Malawi", network: "Airtel Malawi" },
  { mcc: "643", mnc: "01", country: "Mozambique", network: "mcel (TMcel)" },
  { mcc: "643", mnc: "03", country: "Mozambique", network: "Vodacom Mozambique" },
  { mcc: "643", mnc: "04", country: "Mozambique", network: "Movitel" },
  { mcc: "649", mnc: "01", country: "Namibia", network: "MTC Namibia" },
  { mcc: "649", mnc: "03", country: "Namibia", network: "Telecom Namibia (TN Mobile)" },
  { mcc: "655", mnc: "01", country: "South Africa", network: "Vodacom" },
  { mcc: "655", mnc: "02", country: "South Africa", network: "Telkom Mobile" },
  { mcc: "655", mnc: "07", country: "South Africa", network: "Cell C" },
  { mcc: "655", mnc: "10", country: "South Africa", network: "MTN" },
  { mcc: "645", mnc: "01", country: "Zambia", network: "Airtel Zambia" },
  { mcc: "645", mnc: "02", country: "Zambia", network: "MTN Zambia" },
  { mcc: "645", mnc: "03", country: "Zambia", network: "Zamtel" },
  { mcc: "648", mnc: "01", country: "Zimbabwe", network: "NetOne" },
  { mcc: "648", mnc: "03", country: "Zimbabwe", network: "Telecel Zimbabwe" },
  { mcc: "648", mnc: "04", country: "Zimbabwe", network: "Econet Wireless" },
];

export const getNetworkName = (position, device) => {
  if (!position && !device) return "-";
  
  const attrs = position?.attributes || {};
  const deviceAttrs = device?.attributes || {};

  // 1. Direct Attributes Check
  let mcc = attrs.mcc || attrs.mobileCountryCode || deviceAttrs.mcc;
  let mnc = attrs.mnc || attrs.mobileNetworkCode || deviceAttrs.mnc;

  // 2. Traccar Position Network Object
  if ((!mcc || !mnc) && position?.network) {
    const net = position.network;
    mcc = net.homeMobileCountryCode || net.mobileCountryCode;
    mnc = net.homeMobileNetworkCode || net.mobileNetworkCode;

    if ((!mcc || !mnc) && Array.isArray(net.cellTowers) && net.cellTowers.length > 0) {
      const tower = net.cellTowers[0];
      mcc = tower.mobileCountryCode || tower.mcc;
      mnc = tower.mobileNetworkCode || tower.mnc;
    }
  }

  // 3. Nested attributes.network
  if ((!mcc || !mnc) && attrs.network && typeof attrs.network === 'object') {
    const net = attrs.network;
    mcc = net.homeMobileCountryCode || net.mobileCountryCode;
    mnc = net.homeMobileNetworkCode || net.mobileNetworkCode;

    if ((!mcc || !mnc) && Array.isArray(net.cellTowers) && net.cellTowers.length > 0) {
      const tower = net.cellTowers[0];
      mcc = tower.mobileCountryCode || tower.mcc;
      mnc = tower.mobileNetworkCode || tower.mnc;
    }
  }

  // 4. Raw Operator string or concatenated cell tower telemetry (e.g. "64521111520491")
  const rawOp = attrs.operator || attrs.networkOperator || attrs.mccmnc || attrs.cell || attrs.lbs || deviceAttrs.operator;
  if ((!mcc || !mnc) && rawOp) {
    const cleanOp = String(rawOp).replace(/[^0-9]/g, "");
    if (cleanOp.length >= 4) {
      const candidateMcc = cleanOp.substring(0, 3);
      const remaining = cleanOp.substring(3);

      const matchByPrefix = mobileNetworks.find((n) => {
        if (n.mcc !== candidateMcc) return false;
        const numericDbMnc = String(Number(n.mnc));
        return remaining.startsWith(n.mnc) || remaining.startsWith(numericDbMnc);
      });

      if (matchByPrefix) return matchByPrefix.network;

      mcc = candidateMcc;
      mnc = cleanOp.substring(3, 5);
    } else if (typeof rawOp === "string" && isNaN(Number(rawOp))) {
      return rawOp;
    }
  }

  if (!mcc || !mnc) {
    if (attrs.operator) return attrs.operator;
    if (deviceAttrs.operator) return deviceAttrs.operator;
    if (typeof attrs.network === 'string') return attrs.network;
    return "-";
  }

  const cleanMcc = String(mcc).padStart(3, "0");
  const targetMncNumber = Number(mnc);

  // 5. Match with database (Handles "02", "2", 2)
  const match = mobileNetworks.find(
    (n) => n.mcc === cleanMcc && Number(n.mnc) === targetMncNumber
  );

  return match ? match.network : `${cleanMcc}-${mnc}`;
};

export default mobileNetworks;