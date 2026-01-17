import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable Validation globally
  app.useGlobalPipes(new ValidationPipe());
  
  // Enable CORS (so your future Frontend can talk to this Backend)
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();