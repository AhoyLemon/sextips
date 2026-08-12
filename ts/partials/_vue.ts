import { generateTip } from "../lib/tipGenerator.js";
import { sexActs } from "./_sextips.js";
import { addCommas, randomFrom, sendEvent } from "./_functions.js";

declare const Vue: typeof import("vue");
const { createApp, ref, reactive, computed, onMounted } = Vue;

const backgroundImages = [
  "bg2.jpg",
  "bg3.jpg",
  "bg4.jpg",
  "bg5.jpg",
  "bg6.jpg",
  "bg7.jpg",
  "bg8.jpg",
  "bg9.jpg",
  "bg10.jpg",
];

const backgroundColors = ["#622927", "#150f4b", "#073615", "#230622", "#061e26", "#232405", "#210512"];

export function mountApp(): void {
  createApp({
    setup() {
      const device = ref("");
      const browser = ref("");
      const sidebarVisible = ref(false);
      const addToHomescreen = ref(false);
      const hideShareImage = ref(true);
      const shareScreen = ref(false);
      const bannerVisible = ref(false);
      const tipLabel = ref("Great Sex Tip");
      const shareCoversheet = reactive({ backgroundColor: "#622927" });
      const primaryImage = reactive({ backgroundImage: "url(img/bg1.jpg)" });
      const canvas = ref<HTMLCanvasElement | false>(false);
      const imageLoading = ref(false);
      const tipNumber = ref(0);
      const tipsDisplayed = ref(0);
      const currentTip = ref("");

      const tipNumberFormatted = computed(() => "#" + addCommas(tipNumber.value));

      function newBackgroundImage(): void {
        const next = "url(img/" + randomFrom(backgroundImages) + ")";
        if (primaryImage.backgroundImage === next) {
          newBackgroundImage();
        } else {
          primaryImage.backgroundImage = next;
        }
      }

      function newBackgroundColor(): void {
        const next = randomFrom(backgroundColors);
        if (shareCoversheet.backgroundColor === next) {
          newBackgroundColor();
        } else {
          shareCoversheet.backgroundColor = next;
        }
      }

      function generateSexTip(): void {
        currentTip.value = generateTip(sexActs);
        tipNumber.value = Math.floor(Math.random() * 99999) + 1;
        tipsDisplayed.value++;

        if (tipsDisplayed.value % 4 === 0) {
          newBackgroundImage();
        }

        if (tipsDisplayed.value === 5) {
          new Audio("audio/bylemon.mp3").play();
          setTimeout(() => {
            bannerVisible.value = true;
          }, 800);
        }
      }

      function newTip(): void {
        generateSexTip();
        sendEvent("New Tip", currentTip.value);
      }

      function generatePicture(): void {
        hideShareImage.value = false;

        const node = document.getElementById("CurrentTip");
        if (!node) return;

        html2canvas(node, {
          onrendered: (renderedCanvas) => {
            const wrapper = document.getElementById("ShareImageWrapper");
            if (wrapper) {
              wrapper.innerHTML = "";
              wrapper.appendChild(renderedCanvas);
            }
            shareScreen.value = true;
            canvas.value = renderedCanvas;
          },
        });
      }

      function downloadCanvas(): void {
        if (canvas.value) {
          Canvas2Image.saveAsPNG(canvas.value);
        }
      }

      function shareThisTip(): void {
        generatePicture();
        sendEvent("Share this tip", currentTip.value);
      }

      function switchBackground(): void {
        newBackgroundImage();
        newBackgroundColor();
        imageLoading.value = true;
        setTimeout(() => {
          generatePicture();
          imageLoading.value = false;
        }, 300);
        sendEvent("Switch Background", currentTip.value);
      }

      function toggleDrawer(): void {
        sidebarVisible.value = !sidebarVisible.value;
        if (sidebarVisible.value) {
          sendEvent("Info Drawer Opened", "Drawer Open");
        }
      }

      function checkBrowser(): void {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.indexOf("android") > -1) {
          device.value = "android";
          if (ua.indexOf("firefox") > -1) {
            browser.value = "firefox";
          } else if (ua.indexOf("opr") > -1) {
            browser.value = "opera";
          } else if (ua.indexOf("chrome") > -1) {
            browser.value = "chrome";
          }
        } else if (ua.indexOf("iphone") > -1 || ua.indexOf("ipad") > -1 || ua.indexOf("ipod") > -1) {
          device.value = "ios";
        } else if (ua.indexOf("windows") > -1) {
          device.value = "windows";
          if (ua.indexOf("edge") > -1) {
            browser.value = "edge";
          } else if (ua.indexOf("trident") > -1) {
            browser.value = "ie";
          } else if (ua.indexOf("firefox") > -1) {
            browser.value = "firefox";
          } else if (ua.indexOf("opr") > -1) {
            browser.value = "opera";
          } else if (ua.indexOf("vivaldi") > -1) {
            browser.value = "vivaldi";
          } else if (ua.indexOf("chrome") > -1) {
            browser.value = "chrome";
          }
        } else if (ua.indexOf("mac") > -1) {
          device.value = "mac";
          if (ua.indexOf("chrome") > -1) {
            browser.value = "chrome";
          } else if (ua.indexOf("safari") > -1) {
            browser.value = "safari";
          } else if (ua.indexOf("firefox") > -1) {
            browser.value = "firefox";
          }
        } else if (ua.indexOf("cros") > -1) {
          device.value = "chrome";
          browser.value = "chrome";
        }
      }

      onMounted(() => {
        generateSexTip();
        checkBrowser();
      });

      return {
        device,
        browser,
        sidebarVisible,
        addToHomescreen,
        hideShareImage,
        shareScreen,
        bannerVisible,
        tipLabel,
        shareCoversheet,
        primaryImage,
        imageLoading,
        currentTip,
        tipNumberFormatted,
        newTip,
        shareThisTip,
        switchBackground,
        toggleDrawer,
        downloadCanvas,
      };
    },
  }).mount("#app");
}
