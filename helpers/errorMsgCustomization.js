module.exports = (text) => {
  switch (true) {
    case text.includes("insufficient funds"):
      return "Insufficient funds";
    default:
      return text;
  }
};
