import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // <--- This makes it available everywhere!
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // <--- Allow other modules to use it
})
export class PrismaModule {}