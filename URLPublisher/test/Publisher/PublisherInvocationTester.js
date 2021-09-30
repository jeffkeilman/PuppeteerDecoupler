const Publisher = require('../../Publisher')

const main = async (messageObj) => {
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
    const messageString = JSON.stringify(messageObj)
    console.log(`Sending: ${messageString}`)
    publisher.sendMessage(messageString)
  }, 10000)

  process.on('exit', () => {
    publisher.closeChannel()
  })
}

if (require.main === module) {
  main({ key: 'val' })
}
