# URLPublisher
## Description
Connects to a RabbitMQ instance and sets up a generic queue. Allows users to send URL messages to that queue.

## Sample Code
```js
const publisherTest = async () => {
  const Publisher = require('./path/to/Publisher')
  const publisherArgs = {
    rmqHostname: 'Rabbit MQ Hostname',
    rmqUsername: 'Rabbit MQ Username',
    rmqPassword: 'Rabbit MQ Password',
    rmqQueueName: 'Rabbit MQ Queue Name',
    rmqPort: Number('Rabbit MQ Port Number')
  }
  const publisher = new Publisher(publisherArgs)
  await publisher.init()
  
  process.on('exit', () => {
    publisher.closeChannel()
  })

  publisher.sendMessage([
    { url: 'https://www.google.com', name: 'Google' },
    { url: 'https://www.newegg.com', name: 'Newegg' }
  ])
}
publisherTest()
```

See a more detailed example in [PublisherInvocationTester.js](test/Publisher/PublisherInvocationTester.js).
