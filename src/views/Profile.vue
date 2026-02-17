<template>
  <div class="profile-container">
    <div class="profile-header">
      <h2>
        <el-icon><User /></el-icon>
        个人中心
      </h2>
    </div>

    <el-row :gutter="20">
      <!-- 左侧：头像区域 -->
      <el-col :span="8">
        <el-card class="avatar-card">
          <div class="avatar-section">
            <div class="avatar-wrapper" @click="triggerUpload">
              <el-avatar :size="120" :src="avatarUrl" class="user-avatar">
                <el-icon :size="60"><User /></el-icon>
              </el-avatar>
              <div class="avatar-overlay">
                <el-icon :size="24"><Camera /></el-icon>
                <span>更换头像</span>
              </div>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleAvatarChange"
            />
            <h3 class="user-name">{{ profileData.realName || profileData.username }}</h3>
            <el-tag type="primary" size="large">{{ profileData.roleName || '用户' }}</el-tag>
            <p class="join-time" v-if="profileData.createdTime">
              注册时间：{{ formatTime(profileData.createdTime) }}
            </p>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：信息编辑 -->
      <el-col :span="16">
        <!-- 基本信息 -->
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
            </div>
          </template>
          <el-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            label-width="100px"
          >
            <el-form-item label="账号" prop="username">
              <el-input v-model="profileForm.username" placeholder="请输入账号" />
            </el-form-item>
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="profileForm.realName" placeholder="请输入真实姓名" />
            </el-form-item>
            <el-form-item label="手机号码" prop="phone">
              <el-input v-model="profileForm.phone" placeholder="请输入手机号码" maxlength="11" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveProfile" :loading="profileLoading">
                保存修改
              </el-button>
              <el-button @click="resetProfileForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 修改密码 -->
        <el-card class="info-card" style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>修改密码</span>
            </div>
          </template>
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
          >
            <el-form-item label="旧密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="请输入旧密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="danger" @click="handleChangePassword" :loading="passwordLoading">
                修改密码
              </el-button>
              <el-button @click="resetPasswordForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Camera } from '@element-plus/icons-vue'
import { getUserProfile, updateUserProfile, updateUserPassword, uploadAvatar } from '@/api/profile'

const baseUrl = import.meta.env.VITE_APP_BASE_API

// 用户信息
const profileData = ref({})

// 头像URL计算
const avatarUrl = computed(() => {
  const avatar = profileData.value.avatar
  if (!avatar) return ''
  // 如果是完整URL直接返回
  if (avatar.startsWith('http')) return avatar
  // 头像路径以/uploads开头，通过api代理拼接
  return baseUrl + avatar
})

// 基本信息表单
const profileFormRef = ref(null)
const profileLoading = ref(false)
const profileForm = reactive({
  username: '',
  realName: '',
  phone: ''
})

const profileRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 密码表单
const passwordFormRef = ref(null)
const passwordLoading = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 加载用户信息
const loadProfile = async () => {
  try {
    const res = await getUserProfile()
    if (res.code === 200) {
      profileData.value = res.data
      profileForm.username = res.data.username || ''
      profileForm.realName = res.data.realName || ''
      profileForm.phone = res.data.phone || ''
    }
  } catch (error) {
    console.error('加载个人信息失败:', error)
  }
}

// 保存基本信息
const handleSaveProfile = async () => {
  if (!profileFormRef.value) return
  await profileFormRef.value.validate(async (valid) => {
    if (!valid) return
    profileLoading.value = true
    try {
      const res = await updateUserProfile({
        username: profileForm.username,
        realName: profileForm.realName,
        phone: profileForm.phone
      })
      if (res.code === 200) {
        ElMessage.success('个人信息修改成功')
        loadProfile()
      } else {
        ElMessage.error(res.msg || '修改失败')
      }
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || '修改失败'
      ElMessage.error(msg)
    } finally {
      profileLoading.value = false
    }
  })
}

// 重置基本信息表单
const resetProfileForm = () => {
  profileForm.username = profileData.value.username || ''
  profileForm.realName = profileData.value.realName || ''
  profileForm.phone = profileData.value.phone || ''
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    passwordLoading.value = true
    try {
      const res = await updateUserPassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      })
      if (res.code === 200) {
        ElMessage.success('密码修改成功，请重新登录')
        resetPasswordForm()
      } else {
        ElMessage.error(res.msg || '修改失败')
      }
    } catch (error) {
      const msg = error.response?.data?.msg || error.message || '修改密码失败'
      ElMessage.error(msg)
    } finally {
      passwordLoading.value = false
    }
  })
}

// 重置密码表单
const resetPasswordForm = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

// 头像上传
const fileInput = ref(null)

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 校验文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return
  }

  // 校验文件大小（最大2MB）
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return
  }

  try {
    // 上传图片
    const uploadRes = await uploadAvatar(file)
    if (uploadRes.code === 200) {
      const avatarPath = uploadRes.data
      // 更新头像
      const updateRes = await updateUserProfile({ avatar: avatarPath })
      if (updateRes.code === 200) {
        ElMessage.success('头像更新成功')
        loadProfile()
      }
    } else {
      ElMessage.error('头像上传失败')
    }
  } catch (error) {
    ElMessage.error('头像上传失败')
  }

  // 清空file input，以便重复选择同一文件
  event.target.value = ''
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.profile-header {
  margin-bottom: 20px;
}

.profile-header h2 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
  font-size: 22px;
}

.avatar-card {
  text-align: center;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  width: 120px;
  height: 120px;
}

.user-avatar {
  border: 3px solid #409EFF;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 50%;
}

.avatar-overlay span {
  font-size: 12px;
  margin-top: 4px;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.user-name {
  margin: 16px 0 8px;
  font-size: 20px;
  color: #333;
}

.join-time {
  margin-top: 12px;
  color: #909399;
  font-size: 13px;
}

.info-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
</style>
