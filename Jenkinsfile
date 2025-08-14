pipeline {
    agent any
    
    tools {
        nodejs 'Node18'
    }
    
    environment {
        DOCKER_IMAGE = 'my-react-app'
        DOCKER_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('1. Kodni Yuklab Olish') {
            steps {
                echo '📥 Repository dan kod yuklab olinmoqda...'
                checkout scm
            }
        }
        
        stage('2. Dependencies O\'rnatish') {
            steps {
                echo '📦 Node.js dependencies o\'rnatilmoqda...'
                sh 'npm ci'
            }
        }
        
        stage('3. Xavfsizlik Skanerlari') {
            parallel {
                stage('3a. Dependency Security Check') {
                    steps {
                        echo '🔍 Dependencies xavfsizlik tekshiruvi...'
                        sh 'npm audit --audit-level high || true'
                    }
                }
                stage('3b. Kod Sifati Tekshiruvi') {
                    steps {
                        echo '📊 Kod sifati tekshirilmoqda...'
                        sh 'npm run lint || true'
                    }
                }
            }
        }
        
        stage('4. Testlar') {
            steps {
                echo '🧪 Unit testlar bajarilmoqda...'
                sh 'npm run test:ci'
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'junit.xml'
                    publishCoverage adapters: [
                        istanbulCoberturaAdapter('coverage/cobertura-coverage.xml')
                    ]
                }
            }
        }
        
        stage('5. Build Qilish') {
            steps {
                echo '🏗️ React app build qilinmoqda...'
                sh 'npm run build'
            }
        }
        
        stage('6. Docker Image Yaratish') {
            steps {
                echo '🐳 Docker image yaratilmoqda...'
                sh """
                    docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .
                    docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest
                """
            }
        }
        
        stage('7. Container Xavfsizlik Skaneri') {
            steps {
                echo '🔒 Docker image xavfsizlik tekshiruvi...'
                sh """
                    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \\
                    aquasec/trivy image ${DOCKER_IMAGE}:${DOCKER_TAG} || true
                """
            }
        }
        
        stage('8. Deploy (Staging)') {
            steps {
                echo '🚀 Staging muhitga deploy qilinmoqda...'
                sh """
                    docker run -d --name react-staging-${BUILD_NUMBER} \\
                    -p 308${BUILD_NUMBER}:80 ${DOCKER_IMAGE}:${DOCKER_TAG}
                """
            }
        }
        
        stage('9. Smoke Test') {
            steps {
                echo '💨 Smoke test bajarilmoqda...'
                script {
                    def port = "308${BUILD_NUMBER}"
                    sh "sleep 10" // Container ishga tushishini kutish
                    sh "curl -f http://localhost:${port} || exit 1"
                }
            }
        }
        
        stage('10. Production Deploy') {
            when {
                branch 'main'
            }
            input {
                message "Production ga deploy qilishni tasdiqlaysizmi?"
                ok "Ha, deploy qil!"
            }
            steps {
                echo '🎯 Production ga deploy qilinmoqda...'
                sh """
                    docker stop react-production || true
                    docker rm react-production || true
                    docker run -d --name react-production \\
                    -p 3000:80 ${DOCKER_IMAGE}:${DOCKER_TAG}
                """
            }
        }
    }
    
    post {
        always {
            echo '🧹 Temporary containerlar tozalanmoqda...'
            sh """
                docker stop react-staging-${BUILD_NUMBER} || true
                docker rm react-staging-${BUILD_NUMBER} || true
                docker image prune -f
            """
        }
        
        success {
            echo '✅ Pipeline muvaffaqiyatli yakunlandi!'
            // Slack yoki email xabar yuborish mumkin
        }
        
        failure {
            echo '❌ Pipeline muvaffaqiyatsiz yakunlandi!'
            // Xatolik xabari yuborish
        }
    }
}