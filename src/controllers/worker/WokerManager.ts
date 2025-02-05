export class LLMWorkerManager {
    private static workers: Map<string, Worker> = new Map();

    static getWorker(chatRoomId: string): Worker {
        if (!this.workers.has(chatRoomId)) {
            this.workers.set(chatRoomId, new Worker('./worker.ts'));
        }
        return this.workers.get(chatRoomId)!;
    }

    static terminateWorker(chatRoomId: string) {
        if (this.workers.has(chatRoomId)) {
            this.workers.get(chatRoomId)?.terminate();
            this.workers.delete(chatRoomId);
        }
    }

    static terminateAll() {
        this.workers.forEach((worker) => worker.terminate());
        this.workers.clear();
    }
}
