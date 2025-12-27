const { SerialPort } = require('serialport');

const port = new SerialPort({
  path: 'COM3',       // change if needed
  baudRate: 9600,
  autoOpen: true
});

// Listen to ESP output
port.on('data', (data) => {
  console.log('ESP:', data.toString());
});

port.on('error', (err) => {
  console.error('Serial error:', err.message);
});

function updateESP(pending, rejected) {
  const total = pending + rejected;
  const signal = total > 5 ? '1' : '0';

  console.log(`Pending: ${pending}, Rejected: ${rejected}, Sending: ${signal}`);

  port.write(signal + '\n', (err) => {
    if (err) console.error('Write error:', err.message);
  });
}

module.exports = { updateESP };
