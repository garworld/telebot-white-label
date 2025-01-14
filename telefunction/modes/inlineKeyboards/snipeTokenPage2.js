module.exports = (snipingPreparation) => {
  return [
    [
      {
        text: "\u2261 Menu",
        callback_data: "!menu",
      },
    ],
    [
      {
        text: "======== Specific Settings =======",
        callback_data: "none",
      },
    ],
    [
      {
        text:
          (snipingPreparation.first_or_fail ? "\uD83D\uDFE2" : "\uD83D\uDD34") +
          " First Bundle or Fail",
        callback_data: "!snipefirstbundle",
      },
    ],
    // [
    //   {
    //     text: (snipingPreparation.degen_mode ? "\uD83D\uDFE2" : "\uD83D\uDD34") + " Degen Mode",
    //     callback_data: "!snipedegenmode",
    //   },
    //   {
    //     text: (snipingPreparation.anti_rug ? "\uD83D\uDFE2" : "\uD83D\uDD34") + " Anti-Rug",
    //     callback_data: "!snipeantirug",
    //   },
    // ],
    [
      {
        text:
          (snipingPreparation.max_tx ? "\uD83D\uDFE2" : "\uD83D\uDD34") +
          " Max Tx or Revert",
        callback_data: "!snipemaxtx",
      },
      {
        text:
          (snipingPreparation.min_tx ? "\uD83D\uDFE2" : "\uD83D\uDD34") +
          " Min Tx or Revert",
        callback_data: "!snipemintx",
      },
    ],
    [
      {
        text:
          (snipingPreparation.pre_approve ? "\uD83D\uDFE2" : "\uD83D\uDD34") +
          " Pre-Approve",
        callback_data: "!snipepreapprove",
      },
      // {
      //   text: (snipingPreparation.tx_on_blacklist ? "\uD83D\uDFE2" : "\uD83D\uDD34") + " Transfer on Blacklist",
      //   callback_data: "!snipeblacklist",
      // },
    ],
    [
      {
        text: "=========== Settings Navigator ===========",
        callback_data: "none",
      },
    ],
    [
      {
        text: "⬅️ Reset Settings",
        callback_data: "!snipetoken",
      },
      {
        text: "Next Settings ➡️",
        callback_data: "!snipesettings2",
      },
    ],
  ];
};
