const Consumer = require('../../Consumer')

const main = async () => {
  const myDataPersistenceClosure = (messageArr) => {
    messageArr.forEach((msg) => console.log(msg))
  }
  const consumerArgs = {
    rmqHostname: process.env.RMQ_HOSTNAME,
    rmqUsername: process.env.RMQ_USERNAME,
    rmqPassword: process.env.RMQ_PASSWORD,
    rmqQueueName: process.env.RMQ_QUEUE_NAME,
    rmqPort: Number(process.env.RMQ_PORT),
    dataPersistenceClosure: myDataPersistenceClosure
  }
  const consumer = new Consumer(consumerArgs)
  await consumer.init()

  consumer.consume()

  process.on('exit', () => {
    consumer.closeChannel()
  })
}

if (require.main === module) {
  main()
}
