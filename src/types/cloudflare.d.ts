declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB: any;
    }
  }
  interface CloudflareEnv {
    DB: any;
  }
}

export {};
