

const fechaActualServer = () => {
    let current_timestamp = new Date();
    current_timestamp.setTime(
      current_timestamp.getTime() -
        current_timestamp.getTimezoneOffset() * 60 * 1000
    );
    return current_timestamp;
  };

const esperarSeg =   (ms) => {

    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    fechaActualServer,
    esperarSeg
};