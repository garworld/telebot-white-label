const numeral = require("numeral");
const { logger } = require("./logger");

/**
 * formatNumber(number)
 * 
 * @param { number } number
//  * @returns { Promise<string> }
 */

const formatNumber = (number) => {
  try {
    if (isNaN(number)) {
      return number;
    }
    if (Number(number) === 0) {
      return "0";
    }
    if (number >= 1) {
      return numeral(number).format("0.00a").toUpperCase();
    }
    if (number < 1) {
      const decimal = number.toString().split(".")[1];
      if (decimal && !decimal.includes("e")) {
        if (decimal.length === 1) {
          return numeral(number).format("0.0");
        }
        if (decimal.length === 2) {
          return numeral(number).format("0.00");
        }
        const count = decimal.match(/^0*/)[0].length;
        if (count >= 3) {
          return Number.parseFloat(number).toExponential(1);
        } else if (count <= 2) {
          return numeral(number).format("0.000");
        }
      }
    }
    return number.toString();
  } catch (err) {
    logger.error("ABBREVIATE NUMBER ERROR: " + err.message);

    //
    return err;
  }
};

module.exports = {
  formatNumber,
};
