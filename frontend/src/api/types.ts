export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface TcpFlags {
  CWR: boolean
  ECE: boolean
  URG: boolean
  ACK: boolean
  PSH: boolean
  RST: boolean
  SYN: boolean
  FIN: boolean
}

export interface NetworkFlow {
  id: number
  start_timestamp_us: string
  duration_us: string
  source_ip: string
  destination_ip: string
  source_port: number
  destination_port: number
  protocol: string
  packet_count: number
  byte_count: number
  tcp_flags: TcpFlags | null
}

export type WindowType = 'GLOBAL' | 'SOURCE' | 'DESTIN' | 'SO1DE1'

export interface TimeWindow {
  id: number
  start_timestamp_us: string
  duration_us: string
  type: WindowType
}

export interface Detection {
  id: number
  method: string
  rule_id: string
  detected_at_us: string
  type: string
  severity: Severity
  confidence: number
  source_ip: string | null
  destination_ip: string | null
  key_feature_values: unknown
  explanation: string
  window: number
}

export interface WindowStatistics {
  total_network_flows: number
  packets_per_second: number
  bytes_per_second: number
  active_connections: number
}

export interface ApiCollection<T> {
  count: number
  results: T[]
}

export interface HealthResponse {
  status: string
  service: string
}

export interface DetectionFilterParams {
  start_timestamp_us?: string
  end_timestamp_us?: string
  type?: string
  severity?: Severity | ''
  source_ip?: string
  destination_ip?: string
}
