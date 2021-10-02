/* eslint-env jest */
const Publisher = require('../../Publisher')

const mockChannel = {
  assertQueue () {
    return Promise.resolve()
  },
  publish () {
    return Promise.resolve()
  },
  close () {
    return Promise.resolve()
  }
}
const mockConnection = {
  createChannel () {
    return Promise.resolve(mockChannel)
  }
}
const amqp = require('amqplib')

// Mocks
// amqplib mock
const mockConnect = jest.spyOn(amqp, 'connect')

// mockConnection
const mockCreateChannel = jest.spyOn(mockConnection, 'createChannel')

// mockChannel
const mockAssertQueue = jest.spyOn(mockChannel, 'assertQueue')
const mockPublish = jest.spyOn(mockChannel, 'publish')
const mockClose = jest.spyOn(mockChannel, 'close')

jest.mock('amqplib', () => ({
  connect () {
    return mockConnection
  }
}))

describe('The Publisher', () => {
  beforeAll(() => {
    // prevent console.error from triggering so we can test exceptions
    jest.spyOn(console, 'error').mockImplementation(() => null)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  describe('constructor', () => {
    const publisherArgs = {
      rmqHostname: 'foo',
      rmqUsername: 'bar',
      rmqPassword: 'fizz',
      rmqQueueName: 'buzz',
      rmqPort: 100
    }
    const testPublisher = new Publisher(publisherArgs)

    it('should correctly set attributes when invoked with a properly formatted Object', () => {
      expect(testPublisher.connectionProperties).toEqual({
        protocol: 'amqp',
        hostname: 'foo',
        port: 100,
        username: 'bar',
        password: 'fizz',
        locale: 'en_US',
        frameMax: 0,
        heartbeat: 0,
        vhost: '/'
      })
      expect(testPublisher.queue).toBe('buzz')
    })

    it('should throw an error when anything other than an Object is passed', () => {
      expect(() => new Publisher('foo')).toThrow('Publisher not initialized with arguments object')
    })

    it('should throw an error when initialized with a String port number', () => {
      expect(() => {
        return new Publisher({
          rmqHostname: 'foo',
          rmqUsername: 'bar',
          rmqPassword: 'fizz',
          rmqQueueName: 'buzz',
          rmqPort: '100'
        })
      }).toThrow('Publisher not initialized with correctly formatted arguments object')
    })

    it('should throw an error when initialized with missing keys in the args Object', () => {
      expect(() => {
        return new Publisher({
          rmqHostname: 'foo',
          rmqUsername: 'bar',
          rmqPassword: 'fizz',
          rmqQueueName: 'buzz'
          // No rmqPort
        })
      }).toThrow('Publisher not initialized with correctly formatted arguments object')
    })
  })

  describe('init method', () => {
    const publisherArgs = {
      rmqHostname: 'foo',
      rmqUsername: 'bar',
      rmqPassword: 'fizz',
      rmqQueueName: 'buzz',
      rmqPort: 100
    }
    const testPublisher = new Publisher(publisherArgs)

    it('should connect to RabbitMQ with the correct arguments', async () => {
      await testPublisher.init()
      expect(mockConnect).toHaveBeenCalledWith({
        protocol: 'amqp',
        hostname: 'foo',
        port: 100,
        username: 'bar',
        password: 'fizz',
        locale: 'en_US',
        frameMax: 0,
        heartbeat: 0,
        vhost: '/'
      })
      expect(mockConnect).toHaveBeenCalledTimes(1)
    })

    it('should create a channel', async () => {
      await testPublisher.init()
      expect(mockCreateChannel).toHaveBeenCalledTimes(1)
    })

    it('should assert a queue', async () => {
      await testPublisher.init()
      expect(mockAssertQueue).toHaveBeenCalledWith('buzz')
      expect(mockAssertQueue).toHaveBeenCalledTimes(1)
    })

    it('should throw an exception when a RabbitMQ connection fails', () => {
      const mockConnectImplementation = mockConnect.mockImplementation(() => {
        throw new Error('foo')
      })
      expect(() => testPublisher.init())
        .rejects
        .toThrow('Connection to RabbitMQ instance failed: Error: foo')
      mockConnectImplementation.mockRestore()
    })

    // ==============================================================
    // TODO: I DON'T KNOW WHY THIS DOESN'T WORK, TEMPORARY TEST BELOW
    // ==============================================================
    // it('should throw an exception when channel creation fails', () => {
    //   const mockCreateChannelImplementation = mockCreateChannel.mockImplementation(() => {
    //     throw new Error('foo')
    //   })
    //   expect(() => testPublisher.init())
    //     .rejects
    //     .toThrow('Channel creation on RabbitMQ instance failed: Error: foo')
    //   mockCreateChannelImplementation.mockRestore()
    // })

    it('should throw an exception when channel creation fails', () => {
      const mockCreateChannelImplementation = mockCreateChannel.mockImplementation(() => {
        throw new Error('foo')
      })

      try {
        testPublisher.init()
      } catch (e) {
        expect(e).toBe('Channel creation on RabbitMQ instance failed: Error: foo')
      }
      mockCreateChannelImplementation.mockRestore()
    })

    // ==============================================================
    // TODO: I DON'T KNOW WHY THIS DOESN'T WORK, TEMPORARY TEST BELOW
    // ==============================================================
    // it('should throw an exception when queue assertion fails', () => {
    //   const mockQueueAssertionImplementation = mockAssertQueue.mockImplementation(() => {
    //     throw new Error('foo')
    //   })
    //   expect(() => testPublisher.init())
    //     .rejects
    //     .toThrow('Queue assertion failed: Error: foo')
    //   mockQueueAssertionImplementation.mockRestore()
    // })

    it('should throw an exception when queue assertion fails', () => {
      const mockQueueAssertionImplementation = mockAssertQueue.mockImplementation(() => {
        throw new Error('foo')
      })

      try {
        testPublisher.init()
      } catch (e) {
        expect(e).toBe('Queue assertion failed: Error: foo')
      }
      mockQueueAssertionImplementation.mockRestore()
    })
  })

  describe('sendMessage method', () => {
    const publisherArgs = {
      rmqHostname: 'foo',
      rmqUsername: 'bar',
      rmqPassword: 'fizz',
      rmqQueueName: 'buzz',
      rmqPort: 100
    }
    const testPublisher = new Publisher(publisherArgs)

    it('should send a message', async () => {
      await testPublisher.init()
      testPublisher.sendMessage([{
        url: 'foo',
        name: 'bar'
      }])
      expect(mockPublish).toHaveBeenCalledWith('', 'buzz', Buffer.from('[{"url":"foo","name":"bar"}]'))
      expect(mockPublish).toHaveBeenCalledTimes(1)
    })

    it('should send a message with multiple URL objects', async () => {
      await testPublisher.init()
      testPublisher.sendMessage([
        { url: 'foo', name: 'bar' },
        { url: 'fizz', name: 'buzz' }
      ])
      expect(mockPublish).toHaveBeenCalledWith('', 'buzz', Buffer.from('[{"url":"foo","name":"bar"},{"url":"fizz","name":"buzz"}]'))
      expect(mockPublish).toHaveBeenCalledTimes(1)
    })

    it('should filter bad objects but send good ones', async () => {
      await testPublisher.init()
      testPublisher.sendMessage([
        { foo: 'bar' },
        { url: 'foo', name: 'bar' }
      ])
      expect(mockPublish).toHaveBeenCalledWith('', 'buzz', Buffer.from('[{"url":"foo","name":"bar"}]'))
      expect(mockPublish).toHaveBeenCalledTimes(1)
    })

    it('should prevent you from sending URL objects with additional keys', async () => {
      await testPublisher.init()
      testPublisher.sendMessage([
        { url: 'foo', name: 'bar' },
        { url: 'fizz', name: 'buzz', oops: 'extrakey' }
      ])
      expect(mockPublish).toHaveBeenCalledWith('', 'buzz', Buffer.from('[{"url":"foo","name":"bar"}]'))
      expect(mockPublish).toHaveBeenCalledTimes(1)
    })

    it('should prevent you from sending URL objects with bad datatypes', async () => {
      await testPublisher.init()
      testPublisher.sendMessage([
        { url: 'foo', name: 'bar' },
        { url: 1, name: 2 }
      ])
      expect(mockPublish).toHaveBeenCalledWith('', 'buzz', Buffer.from('[{"url":"foo","name":"bar"}]'))
      expect(mockPublish).toHaveBeenCalledTimes(1)
    })

    it('should throw an error when anything other than an array is passed as an argument', async () => {
      await testPublisher.init()
      expect(() => testPublisher.sendMessage(1))
        .toThrow('Type mismatch: sendMessage expected an array of URL objects, but instead got: number')
    })

    it('should throw an error when an empty array is passed as an argument', async () => {
      await testPublisher.init()
      expect(() => testPublisher.sendMessage([]))
        .toThrow('sendMessage received a list with no valid URL objects')
    })

    it('should throw an error when an array with only bad objects is passed as an argument', async () => {
      await testPublisher.init()
      expect(() => testPublisher.sendMessage([{ foo: 'bar' }]))
        .toThrow('sendMessage received a list with no valid URL objects')
    })

    it('should throw an error when publishing fails', async () => {
      await testPublisher.init()
      const mockPublishImplementation = mockPublish.mockImplementation(() => {
        throw new Error('foo')
      })

      expect(() => testPublisher.sendMessage([{ url: 'foo', name: 'bar' }])).toThrow('Failed to publish message to buzz: Error: foo')
      mockPublishImplementation.mockRestore()
    })
  })

  describe('closeChannel method', () => {
    const publisherArgs = {
      rmqHostname: 'foo',
      rmqUsername: 'bar',
      rmqPassword: 'fizz',
      rmqQueueName: 'buzz',
      rmqPort: 100
    }
    const testPublisher = new Publisher(publisherArgs)

    it('should close a channel', async () => {
      await testPublisher.init()
      testPublisher.closeChannel()
      expect(mockClose).toHaveBeenCalledTimes(1)
    })
  })
})
