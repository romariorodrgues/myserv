/**
 * Retry service for failed operations in MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

interface RetryOptions {
  maxRetries: number
  initialDelay: number
  backoffMultiplier: number
  maxDelay: number
}

interface RetryableOperation<T> {
  id: string
  operation: () => Promise<T>
  retries: number
  nextRetryAt: number
  lastError?: string
}

class RetryService {
  private operations: Map<string, RetryableOperation<any>> = new Map()
  private isProcessing = false

  constructor(private defaultOptions: RetryOptions = {
    maxRetries: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
    maxDelay: 30000
  }) {
    // Process retries every 5 seconds
    setInterval(() => this.processRetries(), 5000)
  }

  /**
   * Add an operation to retry queue
   */
  async addOperation<T>(
    id: string,
    operation: () => Promise<T>,
    options?: Partial<RetryOptions>
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options }

    try {
      // Try to execute immediately
      return await operation()
    } catch (error) {
      console.error(`Operation ${id} failed, adding to retry queue:`, error)
      
      // Calculate next retry time
      const delay = Math.min(opts.initialDelay, opts.maxDelay)
      const nextRetryAt = Date.now() + delay

      // Add to retry queue
      this.operations.set(id, {
        id,
        operation,
        retries: 0,
        nextRetryAt,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      })

      throw error
    }
  }

  /**
   * Process all pending retries
   */
  private async processRetries(): Promise<void> {
    if (this.isProcessing || this.operations.size === 0) {
      return
    }

    this.isProcessing = true
    const now = Date.now()

    for (const [id, retryOp] of this.operations.entries()) {
      if (now >= retryOp.nextRetryAt) {
        await this.executeRetry(id, retryOp)
      }
    }

    this.isProcessing = false
  }

  /**
   * Execute a single retry operation
   */
  private async executeRetry(id: string, retryOp: RetryableOperation<any>): Promise<void> {
    try {
      console.log(`Retrying operation ${id} (attempt ${retryOp.retries + 1})`)
      
      // Execute the operation
      await retryOp.operation()
      
      // Success - remove from queue
      this.operations.delete(id)
      console.log(`Operation ${id} succeeded on retry`)
      
    } catch (error) {
      retryOp.retries++
      retryOp.lastError = error instanceof Error ? error.message : 'Unknown error'
      
      if (retryOp.retries >= this.defaultOptions.maxRetries) {
        // Max retries reached - remove from queue
        this.operations.delete(id)
        console.error(`Operation ${id} failed after ${retryOp.retries} retries:`, error)
      } else {
        // Calculate next retry time with exponential backoff
        const delay = Math.min(
          this.defaultOptions.initialDelay * Math.pow(this.defaultOptions.backoffMultiplier, retryOp.retries),
          this.defaultOptions.maxDelay
        )
        retryOp.nextRetryAt = Date.now() + delay
        
        console.log(`Operation ${id} failed, will retry in ${delay}ms (attempt ${retryOp.retries}/${this.defaultOptions.maxRetries})`)
      }
    }
  }

  /**
   * Get current retry queue status
   */
  getQueueStatus(): {
    totalOperations: number
    operationsByRetries: Record<number, number>
    oldestOperation?: Date
  } {
    const operationsByRetries: Record<number, number> = {}
    let oldestTimestamp = Infinity

    for (const op of this.operations.values()) {
      operationsByRetries[op.retries] = (operationsByRetries[op.retries] || 0) + 1
      oldestTimestamp = Math.min(oldestTimestamp, op.nextRetryAt)
    }

    return {
      totalOperations: this.operations.size,
      operationsByRetries,
      oldestOperation: oldestTimestamp === Infinity ? undefined : new Date(oldestTimestamp)
    }
  }

  /**
   * Clear all pending operations
   */
  clearQueue(): void {
    this.operations.clear()
  }

  /**
   * Remove specific operation from queue
   */
  removeOperation(id: string): boolean {
    return this.operations.delete(id)
  }
}

// Global retry service instance
export const retryService = new RetryService()

// Specific retry functions for different operations
export class NotificationRetryService {
  /**
   * Retry WhatsApp notification with backoff
   */
  static async retryWhatsAppNotification(
    notificationId: string,
    phoneNumber: string,
    message: string
  ): Promise<void> {
    await retryService.addOperation(
      `whatsapp-${notificationId}`,
      async () => {
        // Import here to avoid circular dependencies
        const { WhatsAppService } = await import('./whatsapp-service')
        
        const success = await WhatsAppService.sendMessage({
          to: phoneNumber,
          message
        } as any)
        
        if (!success) {
          throw new Error('WhatsApp notification failed')
        }
      },
      { maxRetries: 5, initialDelay: 2000 }
    )
  }

  /**
   * Retry email notification with backoff
   */
  static async retryEmailNotification(
    notificationId: string,
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    await retryService.addOperation(
      `email-${notificationId}`,
      async () => {
        // Import here to avoid circular dependencies
        const { EmailService } = await import('./email-service')
        
        const success = await EmailService.sendEmail({
          to,
          subject,
          html
        } as any)
        
        if (!success) {
          throw new Error('Email notification failed')
        }
      },
      { maxRetries: 3, initialDelay: 5000 }
    )
  }
}

export class PaymentRetryService {
  /**
   * Retry payment webhook processing
   */
  static async retryWebhookProcessing(
    webhookId: string,
    webhookData: any
  ): Promise<void> {
    await retryService.addOperation(
      `webhook-${webhookId}`,
      async () => {
        // Process webhook data
        // This would contain the actual webhook processing logic
        console.log('Processing webhook:', webhookData)
        
        // Simulate processing
        if (Math.random() < 0.1) { // 10% chance of failure for demo
          throw new Error('Webhook processing failed')
        }
      },
      { maxRetries: 5, initialDelay: 1000 }
    )
  }
}

export default RetryService
