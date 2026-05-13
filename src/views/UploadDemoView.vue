<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElTag } from 'element-plus'
import ChunkUpload from '@/components/ChunkUpload.vue'
import type { UploadFile } from '@/utils/chunkUploader'

const uploadedFiles = ref<UploadFile[]>([])
const serverUrl = ref('http://localhost:3001')
const backendStatus = ref<'unknown' | 'running' | 'stopped'>('unknown')

const handleSuccess = (result: any, file: UploadFile) => {
  console.log('上传成功:', file.name, result)
  ElMessage.success(file.name + ' 上传成功！')
}

const handleError = (error: Error, file: UploadFile) => {
  console.error('上传失败:', file.name, error)
}

const handleProgress = (progress: number, file: UploadFile) => {
  console.log('上传进度:', file.name, progress.toFixed(2) + '%')
}

const handleChange = (files: UploadFile[]) => {
  uploadedFiles.value = files
}

const checkBackendStatus = async () => {
  try {
    const response = await fetch(`${serverUrl.value}/api/health`)
    const data = await response.json()
    if (data.success) {
      backendStatus.value = 'running'
      ElMessage.success('后端服务运行正常')
    } else {
      backendStatus.value = 'stopped'
    }
  } catch {
    backendStatus.value = 'stopped'
    ElMessage.warning('后端服务未运行，请先启动后端服务器')
  }
}

const startBackendGuide = () => {
  ElMessage.info('请在 terminal 中执行: cd backend && npm install && npm run dev')
}
</script>

<template>
  <div class="upload-demo">
    <el-card class="upload-card">
      <template #header>
        <div class="card-header">
          <span>分片上传组件演示</span>
          <div class="header-actions">
            <el-tag :type="backendStatus === 'running' ? 'success' : backendStatus === 'stopped' ? 'danger' : 'info'" size="small">
              后端状态: {{ backendStatus === 'running' ? '运行中' : backendStatus === 'stopped' ? '已停止' : '未知' }}
            </el-tag>
            <el-button size="small" @click="checkBackendStatus">检查后端</el-button>
          </div>
        </div>
      </template>

      <div class="demo-content">
        <el-alert
          title="使用说明"
          type="info"
          :closable="false"
          class="info-alert"
        >
          <template #default>
            <div class="alert-content">
              <p>本组件支持以下功能：</p>
              <ul>
                <li>📦 <strong>分片上传</strong>：大文件自动切分为多个分片（默认 5MB），支持 GB 级文件</li>
                <li>⏯️ <strong>暂停/继续</strong>：随时暂停上传，稍后继续，进度保存在本地 IndexedDB</li>
                <li>🔄 <strong>断点续传</strong>：刷新页面或重新上传相同文件，自动跳过已上传的分片</li>
                <li>📡 <strong>网络自动恢复</strong>：网络断开自动暂停，恢复后自动继续上传</li>
                <li>🔍 <strong>文件 Hash</strong>：使用 Web Worker 计算文件 hash，避免重复上传</li>
              </ul>
              <p class="backend-hint">
                <el-button type="primary" size="small" @click="startBackendGuide">
                  查看启动后端的命令
                </el-button>
              </p>
            </div>
          </template>
        </el-alert>

        <div class="upload-section">
          <h3>上传区域</h3>
          <ChunkUpload
            :chunk-size="5 * 1024 * 1024"
            :concurrency="3"
            :max-retries="3"
            :upload-chunk-url="serverUrl + '/api/upload/chunk'"
            :merge-url="serverUrl + '/api/upload/merge'"
            :auto-start="true"
            @success="handleSuccess"
            @error="handleError"
            @progress="handleProgress"
            @change="handleChange"
          />
        </div>

        <div class="features-section">
          <h3>组件特性</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card class="feature-card" shadow="never">
                <div class="feature-icon">📦</div>
                <div class="feature-title">分片上传</div>
                <div class="feature-desc">
                  将大文件切分为多个分片（默认 5MB），避免一次性上传大文件导致的超时和内存问题。支持 GB 级文件。
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="feature-card" shadow="never">
                <div class="feature-icon">⏯️</div>
                <div class="feature-title">暂停/继续</div>
                <div class="feature-desc">
                  用户可以随时暂停上传，稍后再继续。进度保存在本地 IndexedDB 中，刷新页面后仍可恢复。
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="feature-card" shadow="never">
                <div class="feature-icon">🔄</div>
                <div class="feature-title">断点续传</div>
                <div class="feature-desc">
                  通过文件 hash 识别文件，刷新页面或重新上传相同文件时，自动跳过已上传的分片。
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="feature-card" shadow="never">
                <div class="feature-icon">📡</div>
                <div class="feature-title">网络自动恢复</div>
                <div class="feature-desc">
                  自动检测网络状态（通过在线事件和心跳检测），网络断开时暂停上传，恢复后自动继续。
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="feature-card" shadow="never">
                <div class="feature-icon">🔍</div>
                <div class="feature-title">文件 Hash</div>
                <div class="feature-desc">
                  使用 Web Worker 在后台计算文件 hash，避免阻塞主线程。相同文件不会重复上传。
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="feature-card" shadow="never">
                <div class="feature-icon">⚡</div>
                <div class="feature-title">并发上传</div>
                <div class="feature-desc">
                  支持并发上传多个分片（默认 3 个），利用多通道提高上传效率。
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <div class="api-section">
          <h3>后端接口说明</h3>
          <el-card class="api-card" shadow="never">
            <div class="api-item">
              <el-tag type="success">POST</el-tag>
              <span class="api-url">/api/upload/chunk</span>
              <span class="api-desc">上传单个分片</span>
              <div class="api-params">
                <p><strong>请求参数 (FormData):</strong></p>
                <ul>
                  <li><code>file</code> - 分片文件</li>
                  <li><code>hash</code> - 文件 hash</li>
                  <li><code>index</code> - 分片索引</li>
                  <li><code>total</code> - 总分片数</li>
                  <li><code>fileName</code> - 文件名</li>
                  <li><code>fileSize</code> - 文件大小</li>
                </ul>
              </div>
            </div>
            <div class="api-item">
              <el-tag type="primary">POST</el-tag>
              <span class="api-url">/api/upload/merge</span>
              <span class="api-desc">合并所有分片</span>
              <div class="api-params">
                <p><strong>请求参数 (JSON):</strong></p>
                <ul>
                  <li><code>hash</code> - 文件 hash</li>
                  <li><code>fileName</code> - 文件名</li>
                  <li><code>total</code> - 总分片数</li>
                  <li><code>fileSize</code> - 文件大小</li>
                </ul>
              </div>
            </div>
            <div class="api-item">
              <el-tag type="warning">GET</el-tag>
              <span class="api-url">/api/upload/check</span>
              <span class="api-desc">检查已上传的分片（可选）</span>
              <div class="api-params">
                <p><strong>请求参数 (Query):</strong></p>
                <ul>
                  <li><code>hash</code> - 文件 hash</li>
                  <li><code>fileName</code> - 文件名</li>
                </ul>
              </div>
            </div>
          </el-card>
        </div>

        <div class="api-section">
          <h3>组件 Props</h3>
          <el-card class="code-card" shadow="never">
            <div class="props-table">
              <table>
                <thead>
                  <tr>
                    <th>参数</th>
                    <th>类型</th>
                    <th>默认值</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>chunkSize</td><td>number</td><td>5 * 1024 * 1024</td><td>分片大小（字节）</td></tr>
                  <tr><td>concurrency</td><td>number</td><td>3</td><td>并发上传数</td></tr>
                  <tr><td>maxRetries</td><td>number</td><td>3</td><td>最大重试次数</td></tr>
                  <tr><td>maxFileSize</td><td>number</td><td>0</td><td>最大文件大小限制（0 表示不限制）</td></tr>
                  <tr><td>uploadChunkUrl</td><td>string</td><td>'/api/upload/chunk'</td><td>分片上传接口</td></tr>
                  <tr><td>mergeUrl</td><td>string</td><td>'/api/upload/merge'</td><td>合并分片接口</td></tr>
                  <tr><td>autoStart</td><td>boolean</td><td>true</td><td>是否自动开始上传</td></tr>
                  <tr><td>showList</td><td>boolean</td><td>true</td><td>是否显示文件列表</td></tr>
                  <tr><td>drag</td><td>boolean</td><td>true</td><td>是否支持拖拽</td></tr>
                  <tr><td>multiple</td><td>boolean</td><td>true</td><td>是否支持多文件</td></tr>
                </tbody>
              </table>
            </div>
          </el-card>
        </div>

        <div class="api-section">
          <h3>组件 Events</h3>
          <el-card class="code-card" shadow="never">
            <div class="props-table">
              <table>
                <thead>
                  <tr>
                    <th>事件名</th>
                    <th>参数</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>success</td><td>(result, file)</td><td>上传成功</td></tr>
                  <tr><td>error</td><td>(error, file)</td><td>上传失败</td></tr>
                  <tr><td>progress</td><td>(progress, file)</td><td>进度更新</td></tr>
                  <tr><td>start</td><td>(file)</td><td>开始上传</td></tr>
                  <tr><td>change</td><td>(files)</td><td>文件列表变化</td></tr>
                </tbody>
              </table>
            </div>
          </el-card>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.upload-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.upload-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.demo-content {
  padding: 20px 0;
}

.info-alert {
  margin-bottom: 24px;
}

.alert-content {
  font-size: 13px;
}

.alert-content ul {
  margin: 8px 0 8px 20px;
  padding: 0;
}

.alert-content li {
  margin: 4px 0;
  line-height: 1.6;
}

.alert-content code {
  background-color: #f4f4f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
}

.backend-hint {
  margin-top: 12px;
}

.upload-section,
.features-section,
.api-section {
  margin-bottom: 32px;
}

.upload-section h3,
.features-section h3,
.api-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.feature-card {
  text-align: center;
  margin-bottom: 20px;
}

.feature-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.feature-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.feature-desc {
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
}

.api-card {
  background-color: #fafafa;
}

.api-item {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
}

.api-item:last-child {
  border-bottom: none;
}

.api-url {
  margin: 0 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  color: #409eff;
}

.api-desc {
  font-size: 13px;
  color: #606266;
}

.api-params {
  width: 100%;
  margin-top: 8px;
  padding-left: 30px;
  font-size: 12px;
  color: #909399;
}

.api-params p {
  margin: 0 0 4px 0;
}

.api-params ul {
  margin: 0 0 0 20px;
  padding: 0;
}

.api-params li {
  margin: 2px 0;
}

.api-params code {
  background-color: #f4f4f5;
  padding: 1px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', monospace;
  color: #e6a23c;
}

.code-card {
  background-color: #fafafa;
}

.props-table {
  overflow-x: auto;
}

.props-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.props-table th,
.props-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
}

.props-table th {
  background-color: #f5f7fa;
  font-weight: 600;
  color: #606266;
}

.props-table td {
  color: #606266;
}

.props-table tr:last-child td {
  border-bottom: none;
}

.props-table code {
  background-color: #f4f4f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  color: #e6a23c;
}
</style>
