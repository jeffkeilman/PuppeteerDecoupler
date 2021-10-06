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

  // setInterval(() => {
  console.log(`Sending: ${messageArr}`)
  publisher.sendMessage(messageArr)
  // }, 10000)

  process.on('exit', () => {
    publisher.closeChannel()
  })
}

if (require.main === module) {
  main([
    { url: 'https://www.google.com', name: 'Google' },
    { url: 'https://www.newegg.com', name: 'Newegg' }
  ])

  main([
    { url: 'https://www.facebook.com', name: 'Facebook' },
    { url: 'https://www.walmart.com', name: 'Walmart' }
  ])

  main([
    { url: 'https://www.neopets.com', name: 'Neopets' },
    { url: 'https://www.amazon.com', name: 'Amazon' }
  ])

  main([
    { url: 'https://www.wikipedia.com', name: 'Wikipedia' },
    { url: 'https://www.reddit.com', name: 'Reddit' }
  ])
}
