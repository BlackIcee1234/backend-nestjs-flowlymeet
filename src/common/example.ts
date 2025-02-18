// src/common/example.ts

// Interface example
export interface ResponseDto {
    message: string;
    data: any;
    status: number;
  }
  
  // Service example
  export class CommonService {
    log(message: string): void {
      console.log(message);
    }
  }
  