import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HttpExceptionFilter } from "./filters/http-exception.filter";
import { IntegrationsModule } from "./integrations/integrations.module";
import { LoggerMiddleware } from "./middleware/logger.middleware";
import { AuthModule } from "./routes/auth/auth.module";
import { UsersModule } from "./routes/users/users.module";
import { WorkspacesModule } from "./routes/workspaces/workspaces.module";
import { WidgetsModule } from './routes/widgets/widgets.module';

@Module({
  imports: [IntegrationsModule, AuthModule, UsersModule, WorkspacesModule, WidgetsModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
