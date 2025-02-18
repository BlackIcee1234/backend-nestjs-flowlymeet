import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import { SWAGGER_TITLE, SWAGGER_DESCRIPTION, SWAGGER_API_VERSION, SWAGGER_TAG, SWAGGER_API_PREFIX} from 'src/constants/constants';

const swaggerConfig = new DocumentBuilder()
    .setTitle(SWAGGER_TITLE)
    .setDescription(SWAGGER_DESCRIPTION)
    .setVersion(SWAGGER_API_VERSION)
    .addTag(SWAGGER_TAG)
    .build();

export async function setupSwagger(app: INestApplication<any>) {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(SWAGGER_API_PREFIX, app, document);
}