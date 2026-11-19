/** 广告空壳：本阶默认关闭，第一局不插任何广告。 */
export const ads = {
  enabled: false,
  showRewarded(): Promise<boolean> {
    return Promise.resolve(false);
  },
  showInterstitial(): Promise<void> {
    return Promise.resolve();
  },
};
