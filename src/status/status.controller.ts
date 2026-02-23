import { Controller, Get } from '@nestjs/common';
import * as packageJson from '../../package.json';

@Controller('status')
export class StatusController {
  @Get()
  getStatus() {
    return {
      version: packageJson.version,
      status: 'ok',
    };
  }
}
