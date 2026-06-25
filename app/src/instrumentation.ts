export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node')
    const { HttpInstrumentation } = await import('@opentelemetry/instrumentation-http')
    const { PgInstrumentation } = await import('@opentelemetry/instrumentation-pg')
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http')
    const { Resource } = await import('@opentelemetry/resources')
    const { SEMRESATTRS_SERVICE_NAME } = await import('@opentelemetry/semantic-conventions')

    const sdk = new NodeSDK({
      resource: new Resource({ [SEMRESATTRS_SERVICE_NAME]: 'intentional-app' }),
      traceExporter: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        ? new OTLPTraceExporter()
        : undefined,
      instrumentations: [new HttpInstrumentation(), new PgInstrumentation()],
    })
    sdk.start()
  }
}
