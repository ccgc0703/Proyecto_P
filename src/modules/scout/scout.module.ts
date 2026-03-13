import { Module } from '@nestjs/common';
import { ScoutService } from './scout.service';
import { ScoutController } from './scout.controller';

@Module({
    providers: [ScoutService],
    controllers: [ScoutController],
    exports: [ScoutService],
})
export class ScoutModule { }
