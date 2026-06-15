export const jsCoreDateCreator = (dateString) => {
  // dateString *HAS* to be in this format "YYYY-MM-DD HH:MM:SS"
  let dateParam = dateString.split(/[\s-:]/);
  //console.log(dateParam);
  dateParam[1] = (parseInt(dateParam[1], 10) - 1).toString();
  return new Date(...dateParam);
};
