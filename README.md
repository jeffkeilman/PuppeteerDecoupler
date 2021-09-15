# PuppeteerDecoupler
## Description
The PuppeteerDecoupler repository consists of multiple microservices that allow one to decouple the process of loading several web pages using Headless Chrome via Puppeteer and either persist their HTML content, or pass it to a downstream process for scraping.

## URLPublisher
Publishes URLs to a RabbitMQ instance

## URLConsumer
Consumers URLs from a RabbitMQ instance. Visits these URLs and dumps their HTML content to a downstream process.