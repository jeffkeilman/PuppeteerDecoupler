const Publisher = require('../../Publisher')

const main = async (messageArr) => {
  const publisherArgs = {
    rmqHostname: process.env.RMQ_HOSTNAME,
    rmqUsername: process.env.RMQ_USERNAME,
    rmqPassword: process.env.RMQ_PASSWORD,
    rmqQueueName: process.env.RMQ_QUEUE_NAME,
    rmqPort: Number(process.env.RMQ_PORT)
  }
  const publisher = new Publisher(publisherArgs)
  await publisher.init()

  setInterval(() => {
    console.log(`Sending: ${messageArr}`)
    publisher.sendMessage(messageArr)
  }, 10000)

  process.on('exit', () => {
    publisher.closeChannel()
  })
}

if (require.main === module) {
  main([
    { url: 'https://www.google.com', name: 'Google' },
    { url: 'https://www.newegg.com', name: 'Newegg' }
  ])
}
