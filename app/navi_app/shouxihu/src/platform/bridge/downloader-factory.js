export function createDownloaderFactory(options = {}) {
  const daxiapp = options.daxiapp || globalThis?.DaxiApp || {};
  const isNativePlatform =
    options.isNativePlatform ||
    function defaultIsNativePlatform(platform) {
      return ["ios_web", "android_web", "android", "ios"].includes(platform);
    };
  const nativeDownloaderCtor = options.nativeDownloaderCtor || globalThis?.DXNativeDownloader;
  const defaultDownloaderCtor = options.downloaderCtor || daxiapp.DXDownloader;

  return {
    create(platform, jsBridge) {
      if (isNativePlatform(platform) && typeof nativeDownloaderCtor === "function") {
        return new nativeDownloaderCtor(jsBridge);
      }

      if (typeof defaultDownloaderCtor === "function") {
        return new defaultDownloaderCtor();
      }

      return null;
    },
  };
}

