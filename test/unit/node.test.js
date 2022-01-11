/* eslint-env mocha */

"use strict";

const proclaim = require("proclaim");
const semver = require("semver");

describe("lib/UA", function () {
  let UA;

  beforeEach(() => {
    UA = require("../../");
  });

  it("exports a UA constructor", () => {
    proclaim.isFunction(UA);
    proclaim.isFunction(UA.prototype.getFamily);
    proclaim.isFunction(UA.prototype.getVersion);
    proclaim.isFunction(UA.prototype.satisfies);
    proclaim.isFunction(UA.prototype.getBaseline);
    proclaim.isFunction(UA.prototype.meetsBaseline);
    proclaim.isFunction(UA.prototype.isUnknown);
    proclaim.isFunction(UA.normalize);
    proclaim.isFunction(UA.getBaselines);
  });

  describe("UA()", () => {
    it("returns other ua", () => {
      proclaim.deepStrictEqual(new UA().ua, {
        family: "other",
        major: "0",
        minor: "0",
        patch: "0",
      });
    });
  });

  describe('UA("uastring")', () => {
    describe("removes iOS webview browsers from uastring", () => {
      it("firefox for iOS", () => {
        const firefoxIOS =
          "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/23.0 Mobile/16B92 Safari/605.1.15";
        proclaim.equal(UA.normalize(firefoxIOS), "ios_saf/11.0.0");
      });

      it("chrome for iOS", () => {
        const chromeIOS =
          "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/80.0.3987.95 Mobile/15E148 Safari/605.1";
        proclaim.equal(UA.normalize(chromeIOS), "ios_saf/11.0.0");
      });

      it("opera for iOS", () => {
        const operaIOS =
          "Mozilla/5.0 (iPad; CPU OS 11_2_6 like Mac OS X) AppleWebKit/604.5.6 (KHTML, like Gecko) OPiOS/16.0.8.121059 Mobile/15D100 Safari/9537.53";
        proclaim.equal(UA.normalize(operaIOS), "ios_saf/11.0.0");
      });
    });

    describe("removes Electron browsers from uastring to enable them to report as Chrome", () => {
      it("Electron for OS X", () => {
        const electron =
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) WELLMessenger/1.1.0 Chrome/53.0.2785.143 Electron/1.4.13 Safari/537.36";
        proclaim.equal(UA.normalize(electron), "chrome/53.0.0");
      });

      it("Electron for Windows", () => {
        const electron =
          "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) WELLMessenger/1.1.0 Chrome/53.0.2785.143 Electron/1.4.13 Safari/537.36";
        proclaim.equal(UA.normalize(electron), "chrome/53.0.0");
      });
    });

    describe("removes Facebook in-app browsers from uastring", () => {
      it("Facebook for iOS", () => {
        const facebook =
          "Mozilla/5.0 (iPhone; CPU iPhone OS 9_2 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13C75 [FBAN/FBIOS;FBAV/46.0.0.54.156;FBBV/18972819;FBDV/iPhone8,1;FBMD/iPhone;FBSN/iPhone OS;FBSV/9.2;FBSS/2; FBCR/Telenor;FBID/phone;FBLC/nb_NO;FBOP/5]";
        proclaim.equal(UA.normalize(facebook), "ios_saf/9.0.0");
      });

      it("Webview in iOS App with short ua", () => {
        const iosApp =
          "Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
        proclaim.equal(UA.normalize(iosApp), "ios_saf/15.2.0");
      });

      it("Facebook for Android, using Chrome browser", () => {
        const facebook =
          "Mozilla/5.0 (Linux; Android 4.4.2; SCH-I535 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/70.0.0.0 Mobile Safari/537.36 [FBAN/FB4A;FBAV/20.0.0.25.15;]";
        proclaim.equal(UA.normalize(facebook), "chrome/70.0.0");
      });
    });

    describe("when given a normalized ua", () => {
      it("constructs a new useragent.Agent", () => {
        const ie = new UA("ie/11.3.0");
        proclaim.equal(ie.getFamily(), "ie");
        proclaim.equal(ie.getVersion(), "11.3.0");
      });

      it("assigns 0 to minor and patch versions if ommitted", () => {
        const ie = new UA("ie/11");
        proclaim.equal(ie.getVersion(), "11.0.0");
      });
    });
  });

  describe(".getFamily", () => {
    it("uses browser family name if no alias found", () => {
      const firefox = new UA(
        "Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.2.12) Gecko/20101027 Ubuntu/10.04 (lucid) Firefox/50.6.12"
      );
      proclaim.equal(firefox.ua.family, "firefox");

      const safari = new UA(
        "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_5; en-us) AppleWebKit/533.18.1 (KHTML, like Gecko) Version/9.0.2 Safari/533.18.5"
      );
      proclaim.equal(safari.ua.family, "safari");

      const android = new UA(
        "Mozilla/5.0 (Linux; U; Android 4.3.1; en-us; GT-P7510 Build/HRI83) AppleWebKit/534.13 (KHTML, like Gecko) Version/4.0 Safari/534.13"
      );
      proclaim.equal(android.ua.family, "android");

      const chrome = new UA(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36"
      );
      proclaim.equal(chrome.ua.family, "chrome");
    });

    it("uses alias for browser family name if alias exists", () => {
      const waterfox = new UA(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:56.0) Gecko/20100101 Firefox/56.0 Waterfox/56.2.12"
      );
      proclaim.equal(waterfox.ua.family, "firefox");

      const opera = new UA(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.10 Safari/537.36 OPR/27.0.1689.22 (Edition developer)"
      );
      proclaim.equal(opera.ua.family, "chrome");

      const blackberryWebKit = new UA(
        "Mozilla/5.0 (BB10; Touch) AppleWebKit/537.3+ (KHTML, like Gecko) Version/10.0.9.388 Mobile Safari/537.3+"
      );
      proclaim.equal(blackberryWebKit.ua.family, "bb");

      const blackberry = new UA(
        "Mozilla/5.0 (BlackBerry; U; BlackBerry 9930; en) AppleWebKit/534.11+ (KHTML, like Gecko) Version/7.0.0.362 Mobile Safari/534.11+"
      );
      proclaim.equal(blackberry.ua.family, "bb");

      // const blackberry = new UA("BlackBerry8520/5.0.0.592 Profile/MIDP-2.1 Configuration/CLDC-1.1 VendorID/168");
      // proclaim.equal(blackberry.ua.family, "BlackBerry");

      const palemoon = new UA(
        "Mozilla/5.0 (Windows NT 5.1; rv:2.0) Gecko/20110407 Firefox/50.0.3 PaleMoon/50.0.3"
      );
      proclaim.equal(palemoon.ua.family, "firefox");

      const firefoxMobile = new UA(
        "Mozilla/5.0 (Android 5.0; Tablet; rv:41.0) Gecko/41.0 Firefox/41.0"
      );
      proclaim.equal(firefoxMobile.ua.family, "firefox_mob");

      const firefoxBeta = new UA(
        "Mozilla/5.0 (X11; Linux i686 (x86_64); rv:2.0b4) Gecko/20100818 Firefox/45.0b4"
      );
      proclaim.equal(firefoxBeta.ua.family, "firefox");

      const mozillaDeveloperPreview = new UA(
        "Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US; rv:1.9.3a1) Gecko/20100208 MozillaDeveloperPreview/45.7a1 (.NET CLR 3.5.30729)"
      );
      proclaim.equal(mozillaDeveloperPreview.ua.family, "firefox");

      const operaTablet = new UA(
        "Opera/33.80 (Android 3.2; Linux; Opera Tablet/ADR-1106291546; U; en) Presto/2.8.149 Version/33.10"
      );
      proclaim.equal(operaTablet.ua.family, "chrome");

      const operaMobile = new UA(
        "Opera/9.80 (S60; SymbOS; Opera Mobi/275; U; es-ES) Presto/2.4.13 Version/10.00"
      );
      proclaim.equal(operaMobile.ua.family, "op_mob");

      const operaMini = new UA(
        "SAMSUNG GT-S3330 Opera/9.80 (J2ME/MIDP; Opera Mini/7.1.32840/37.9143; U; en) Presto/2.12.423 Version/12.16"
      );
      proclaim.equal(operaMini.ua.family, "op_mini");

      const chromeMobile = new UA(
        "Mozilla/5.0 (Linux; Android 4.1.2; GT-S7710 Build/JZO54K) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/48.0.1025.166 Mobile"
      );
      proclaim.equal(chromeMobile.ua.family, "chrome");

      const chromeFrame = new UA(
        "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; chromeframe/29.0.660.0)"
      );
      proclaim.equal(chromeFrame.ua.family, "chrome");

      const chromium = new UA(
        "Mozilla/5.0 (X11; U; Linux i686; en-US) AppleWebKit/534.16 (KHTML, like Gecko) Ubuntu/10.10 Chromium/30.0.648.133 Chrome/30.0.648.133 Safari/534.16"
      );
      proclaim.equal(chromium.ua.family, "chrome");

      const ieMobile = new UA(
        "Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/11.0; SAMSUNG; SGH-i917)"
      );
      proclaim.equal(ieMobile.ua.family, "ie_mob");

      const ieLargeScreen = new UA(
        "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0; XBLWP7; ZuneWP7)"
      );
      proclaim.equal(ieLargeScreen.ua.family, "ie");

      const ie = new UA(
        "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.3; WOW64; Trident/7.0; .NET4.0E; .NET4.0C; InfoPath.3)"
      );
      proclaim.equal(ie.ua.family, "ie");

      const ucBrowser = new UA(
        "Mozilla/5.0 (Linux; U; Android 2.2.1; en-US; GT-P1000 Build/FROYO) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 UCBrowser/10.0.1.512 U3/0.8.0 Mobile Safari/534.30"
      );
      proclaim.equal(ucBrowser.ua.family, "other");

      const chromeMobileIos = new UA(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/80.0.3987.95 Mobile/15E148 Safari/605.1"
      );
      proclaim.equal(chromeMobileIos.ua.family, "ios_saf");

      const mobileSafari = new UA(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1"
      );
      proclaim.equal(mobileSafari.ua.family, "ios_saf");

      const mobileSafariUIWebView = new UA(
        "Mozilla/5.0 (iPod touch; CPU iPhone OS 9_3_2 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13F69"
      );
      proclaim.equal(mobileSafariUIWebView.ua.family, "ios_saf");

      const facebookIOS = new UA(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 9_2 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13C75 [FBAN/FBIOS;FBAV/46.0.0.54.156;FBBV/18972819;FBDV/iPhone8,1;FBMD/iPhone;FBSN/iPhone OS;FBSV/9.2;FBSS/2; FBCR/Telenor;FBID/phone;FBLC/nb_NO;FBOP/5]"
      );
      proclaim.equal(facebookIOS.ua.family, "ios_saf");

      const googleSearchApp = new UA(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/66.0.230776083 Mobile/15E148 Safari/605.1"
      );
      proclaim.equal(googleSearchApp.ua.family, "ios_saf");

      const instagramIOS = new UA(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57 Instagram 80.0.0.12.107"
      );
      proclaim.equal(instagramIOS.ua.family, "ios_saf");

      const samsungInternet = new UA(
        "Mozilla/5.0 (Linux; Android 5.0.1; SAMSUNG GT-I9506-ORANGE Build/LRX22C) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/4.1 Chrome/34.0.1847.76 Mobile Safari/537.36"
      );
      proclaim.equal(samsungInternet.ua.family, "samsung_mob");

      const phantomjs = new UA(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/534.34 (KHTML, like Gecko) PhantomJS/1.6.0 Safari/534.34"
      );
      proclaim.equal(phantomjs.ua.family, "other");

      const yandex = new UA(
        "Mozilla/5.0 (Linux; Android 5.0.1; GT-I9505 Build/LRX22C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 YaBrowser/14.2.1.1239.00 Mobile Safari/537.36"
      );
      proclaim.equal(yandex.ua.family, "chrome");

      const googlebot = new UA(
        "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.96 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
      );
      proclaim.equal(googlebot.ua.family, "chrome");

      const headlesschrome = new UA(
        "Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/66.0.3347.0 Safari/537.36"
      );
      proclaim.equal(headlesschrome.ua.family, "chrome");
    });

    it("returns browser family from useragent", () => {
      const chrome = new UA(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36"
      );
      proclaim.equal(chrome.getFamily(), "chrome");

      const phantom = new UA(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/534.34 (KHTML, like Gecko) PhantomJS/1.9.0 Safari/534.34"
      );
      proclaim.equal(phantom.getFamily(), "other");

      const yandex = new UA(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 YaBrowser/14.10.2062.12057 Safari/537.36"
      );
      proclaim.equal(yandex.getFamily(), "chrome");

      const ie = new UA(
        "Mozilla/5.0 (Windows Phone 10.0;  Android 4.2.1; Nokia; Lumia 520) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Mobile Safari/537.36 Edge/12.10130"
      );
      proclaim.equal(ie.getFamily(), "edge_mob");

      const ios = new UA(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 9_2 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13C75 [FBAN/FBIOS;FBAV/46.0.0.54.156;FBBV/18972819;FBDV/iPhone8,1;FBMD/iPhone;FBSN/iPhone OS;FBSV/9.2;FBSS/2; FBCR/Telenor;FBID/phone;FBLC/nb_NO;FBOP/5]"
      );
      proclaim.equal(ios.getFamily(), "ios_saf");
    });
  });

  describe(".getVersion", () => {
    it("returns the full version of the ua", () => {
      const ua = new UA("ie/11.3.0");
      proclaim.equal(ua.getVersion(), "11.3.0");
    });
  });

  describe(".satisfies", () => {
    it("returns false if browser is not within the supported browsers", () => {
      const ua = new UA("abcdefghi/11.0");
      proclaim.equal(ua.satisfies("^11.0.0"), false);
    });

    it("returns false if browser is within the supported browser-versions list but version is lower than the baseline", () => {
      const ua = new UA("ie/5.0");
      proclaim.equal(ua.satisfies("^5.0.0"), false);
    });

    it("returns false if browser is within the supported browser-versions list but not within the range being requested ", () => {
      const ua = new UA("ie/11.0");
      proclaim.equal(ua.satisfies("^12.0.0"), false);
    });

    it("returns true if browser is within the supported browser-versions list and within the range being requested ", () => {
      const ua = new UA("ie/11.0");
      proclaim.equal(ua.satisfies("^11.0.0"), true);
    });
  });

  describe(".getBaseline", () => {
    it("returns the baseline version for the browser if it is in our supported list", () => {
      const ua = new UA("ie/11.0");
      proclaim.isString(ua.getBaseline());
    });

    it("returns undefined if the browser is not in our supported list", () => {
      const ua = new UA("abcdefghi/11.0");
      proclaim.isUndefined(ua.getBaseline());
    });
  });

  describe(".normalize", function () {
    it("should return UA string lowercase if already normalized", () => {
      const normalizedUa = UA.normalize("IE/11.3.0");
      proclaim.equal(normalizedUa, "ie/11.3.0");
    });

    it("should resolve user agents of core supported browsers", function () {
      const test = UA.normalize(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36"
      );
      proclaim.equal(test, "chrome/39.0.0");
    });

    it("should resolve user agents of browsers that map all versions to a constant", function () {
      const phantom = UA.normalize(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/534.34 (KHTML, like Gecko) PhantomJS/1.9.0 Safari/534.34"
      );
      proclaim.equal(phantom, "other/0.0.0");
    });

    it("should resolve user agents of browsers with granular version mapping", function () {
      const yandex = UA.normalize(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 YaBrowser/14.10.2062.12057 Safari/537.36"
      );
      proclaim.equal(yandex, "chrome/37.0.0");
    });

    it("should resolve edge mobile to the edge_mob family", function () {
      const test = UA.normalize(
        "Mozilla/5.0 (Windows Phone 10.0;  Android 4.2.1; Nokia; Lumia 520) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Mobile Safari/537.36 Edge/12.10130"
      );
      proclaim.equal(test, "edge_mob/12.10130.0");
    });

    it("should resolve Facebook iOS App to the version of iOS it is running within", function () {
      const test = UA.normalize(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 9_2 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13C75 [FBAN/FBIOS;FBAV/46.0.0.54.156;FBBV/18972819;FBDV/iPhone8,1;FBMD/iPhone;FBSN/iPhone OS;FBSV/9.2;FBSS/2; FBCR/Telenor;FBID/phone;FBLC/nb_NO;FBOP/5]"
      );
      proclaim.equal(test, "ios_saf/9.0.0");
    });

    it("should resolve mobile googlebot 2.1 to current chrome", function () {
      const googlebot = UA.normalize(
        "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.93 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
      );
      proclaim.equal(googlebot, "chrome/83.0.0");
    });

    it("should resolve desktop googlebot 2.1 to chrome 41.0.0", function () {
      const googlebot = UA.normalize(
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
      );
      proclaim.equal(googlebot, "chrome/41.0.0");
    });

    it("should resolve legacy desktop googlebot 2.1 to chrome 41.0.0", function () {
      const googlebot = UA.normalize(
        "Googlebot/2.1 (+http://www.google.com/bot.html)"
      );
      proclaim.equal(googlebot, "chrome/41.0.0");
    });
  });

  describe(".isUnknown", function () {
    it("should resolve false for user agents we have a baseline version for", function () {
      proclaim.equal(new UA("edge/12").isUnknown(), false);
      proclaim.equal(new UA("edge/15").isUnknown(), false);
      proclaim.equal(new UA("edge/16").isUnknown(), false);

      proclaim.equal(new UA("ie/6").isUnknown(), true);
      proclaim.equal(new UA("ie/7").isUnknown(), true);
      proclaim.equal(new UA("ie/8").isUnknown(), true);
      proclaim.equal(new UA("ie/14").isUnknown(), false);

      proclaim.equal(new UA("ie_mob/7").isUnknown(), true);
      proclaim.equal(new UA("ie_mob/8").isUnknown(), true);
      proclaim.equal(new UA("ie_mob/13").isUnknown(), false);

      proclaim.equal(new UA("chrome/1").isUnknown(), true);
      proclaim.equal(new UA("chrome/20").isUnknown(), true);
      proclaim.equal(new UA("chrome/30").isUnknown(), false);
      proclaim.equal(new UA("chrome/35").isUnknown(), false);
      proclaim.equal(new UA("chrome/40").isUnknown(), false);
      proclaim.equal(new UA("chrome/52").isUnknown(), false);

      proclaim.equal(new UA("safari/3").isUnknown(), true);
      proclaim.equal(new UA("safari/4").isUnknown(), true);

      proclaim.equal(new UA("safari/9").isUnknown(), false);

      proclaim.equal(new UA("ios_saf/3").isUnknown(), true);
      proclaim.equal(new UA("ios_saf/4").isUnknown(), true);
      proclaim.equal(new UA("ios_saf/9").isUnknown(), false);

      proclaim.equal(new UA("ios_chr/3").isUnknown(), true);
      proclaim.equal(new UA("ios_chr/4").isUnknown(), true);
      proclaim.equal(new UA("ios_chr/9").isUnknown(), false);

      proclaim.equal(new UA("firefox/48.0").isUnknown(), false);
      proclaim.equal(new UA("firefox/3.6").isUnknown(), true);
      proclaim.equal(new UA("firefox/3.5").isUnknown(), true);
      proclaim.equal(new UA("firefox/3.0").isUnknown(), true);
      proclaim.equal(new UA("firefox/2.0").isUnknown(), true);
      proclaim.equal(new UA("firefox/1.5").isUnknown(), true);
      proclaim.equal(new UA("firefox/1.0").isUnknown(), true);
      proclaim.equal(new UA("firefox/0.1").isUnknown(), true);

      proclaim.equal(new UA("firefox_mob/48.0").isUnknown(), false);
      proclaim.equal(new UA("firefox_mob/4.0").isUnknown(), true);
      proclaim.equal(new UA("firefox_mob/3.6").isUnknown(), true);
      proclaim.equal(new UA("firefox_mob/3.5").isUnknown(), true);
      proclaim.equal(new UA("firefox_mob/3.0").isUnknown(), true);
      proclaim.equal(new UA("firefox_mob/2.0").isUnknown(), true);
      proclaim.equal(new UA("firefox_mob/1.5").isUnknown(), true);
      proclaim.equal(new UA("firefox_mob/1.0").isUnknown(), true);
      proclaim.equal(new UA("firefox_mob/0.1").isUnknown(), true);

      proclaim.equal(new UA("opera/10").isUnknown(), true);
      proclaim.equal(new UA("opera/11").isUnknown(), true);
      proclaim.equal(new UA("opera/39").isUnknown(), false);

      proclaim.equal(new UA("android/2.0").isUnknown(), true);
      proclaim.equal(new UA("android/3.0").isUnknown(), true);
      proclaim.equal(new UA("android/5").isUnknown(), false);
      proclaim.equal(new UA("android/5.1").isUnknown(), false);

      proclaim.equal(new UA("op_mob/9").isUnknown(), true);
      proclaim.equal(new UA("op_mob/10").isUnknown(), false);
      proclaim.equal(new UA("op_mob/33").isUnknown(), false);

      proclaim.equal(new UA("op_mini/4").isUnknown(), true);
      proclaim.equal(new UA("op_mini/5").isUnknown(), false);

      proclaim.equal(new UA("bb/5").isUnknown(), true);
      proclaim.equal(new UA("bb/6").isUnknown(), false);
      proclaim.equal(new UA("bb/10").isUnknown(), false);

      proclaim.equal(new UA("samsung_mob/3").isUnknown(), true);
      proclaim.equal(new UA("samsung_mob/4").isUnknown(), false);
    });
  });

  describe(".getBaselines", () => {
    it("returns the browsers we support and the minimum supported version as a semver range", () => {
      const browserMinimumVersions = UA.getBaselines();
      proclaim.isObject(browserMinimumVersions, Object);

      describe("Each browser should have a valid semver range", () => {
        const browsers = Object.keys(browserMinimumVersions);
        for (const browser of browsers) {
          it(`${browser} uses a valid semver range`, () => {
            proclaim.isNotNull(
              semver.validRange(browserMinimumVersions[browser])
            );
          });
        }
      });
    });
  });
});
