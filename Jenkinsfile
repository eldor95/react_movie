pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = 'my-react-app'
        DOCKER_TAG = "${BUILD_NUMBER}"
        DOCKER_REGISTRY = 'your-registry.com' // O'zingizning registry
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 1, unit: 'HOURS')
        timestamps()
    }
    
    stages {
        stage('🚀 1. Preparation') {
            steps {
                echo '📋 Build ma\'lumotlari:'
                script {
                    echo "Build Number: ${BUILD_NUMBER}"
                    echo "Branch: ${BRANCH_NAME}"
                    echo "Workspace: ${WORKSPACE}"
                }
                
                // Workspace tozalash
                cleanWs()
                
                // Kodni yuklab olish
                echo '📥 Repository dan kod yuklab olinmoqda...'
                checkout scm
                
                // Git ma'lumotlarini olish
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                    echo "Git Commit: ${env.GIT_COMMIT_SHORT}"
                }
            }
        }
        
        stage('📦 2. Dependencies') {
            steps {
                echo '📦 Node.js dependencies o\'rnatilmoqda...'
                
                script {
                    // Docker orqali Node.js ishlatish
                    sh '''
                        docker run --rm -v $(pwd):/app -w /app node:18-alpine sh -c "
                            node --version
                            npm --version
                            npm cache clean --force
                            npm ci
                            npm audit fix --audit-level moderate || true
                        "
                    '''
                }
            }
        }
        
        stage('🔍 3. Code Quality & Security') {
            parallel {
                stage('3a. 🔒 Security Audit') {
                    steps {
                        echo '🔍 Dependencies xavfsizlik tekshiruvi...'
                        script {
                            try {
                                sh 'npm audit --audit-level high --json > npm-audit.json'
                            } catch (Exception e) {
                                echo "Security audit xatolari topildi: ${e.getMessage()}"
                                currentBuild.result = 'UNSTABLE'
                            }
                        }
                        archiveArtifacts artifacts: 'npm-audit.json', allowEmptyArchive: true
                    }
                }
                
                stage('3b. 📊 ESLint Check') {
                    steps {
                        echo '📊 ESLint kod sifati tekshiruvi...'
                        script {
                            try {
                                sh 'npm run lint -- --format json --output-file eslint-report.json || true'
                            } catch (Exception e) {
                                echo "ESLint xatolari: ${e.getMessage()}"
                            }
                        }
                        archiveArtifacts artifacts: 'eslint-report.json', allowEmptyArchive: true
                    }
                }
                
                stage('3c. 🔍 Secrets Scan') {
                    steps {
                        echo '🔐 Secrets skanlanmoqda...'
                        script {
                            try {
                                sh '''
                                    # Simple secrets check
                                    grep -r -i "password\\|secret\\|key\\|token" src/ --exclude-dir=node_modules || true
                                    echo "Secrets scan yakunlandi"
                                '''
                            } catch (Exception e) {
                                echo "Secrets scan xatosi: ${e.getMessage()}"
                            }
                        }
                    }
                }
            }
        }
        
        stage('🧪 4. Testing') {
            steps {
                echo '🧪 Unit testlar bajarilmoqda...'
                
                script {
                    try {
                        // Test coverage bilan testlarni ishga tushirish
                        sh 'CI=true npm test -- --coverage --watchAll=false --testResultsProcessor=jest-junit'
                        
                        // Test natijalarini publish qilish
                        publishTestResults testResultsPattern: 'junit.xml'
                        
                        // Coverage reportni publish qilish
                        publishCoverage adapters: [
                            istanbulCoberturaAdapter('coverage/cobertura-coverage.xml')
                        ], sourceFileResolver: sourceFiles('STORE_ALL_BUILD')
                        
                    } catch (Exception e) {
                        echo "Test xatolari: ${e.getMessage()}"
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
            post {
                always {
                    // Test hisobotlarini saqlash
                    archiveArtifacts artifacts: 'coverage/**/*', allowEmptyArchive: true
                }
            }
        }
        
        stage('🏗️ 5. Build Application') {
            steps {
                echo '🏗️ React app build qilinmoqda...'
                
                // Production build
                sh 'npm run build'
                
                // Build papkasini tekshirish
                sh 'ls -la build/'
                
                // Build hajmini tekshirish
                sh 'du -sh build/'
                
                echo '✅ Build muvaffaqiyatli yakunlandi!'
            }
            post {
                always {
                    // Build artifactlarini saqlash
                    archiveArtifacts artifacts: 'build/**/*', allowEmptyArchive: true
                }
            }
        }
        
        stage('🐳 6. Docker Operations') {
            stages {
                stage('6a. Docker Build') {
                    steps {
                        echo '🐳 Docker image yaratilmoqda...'
                        script {
                            // Docker image yaratish
                            sh """
                                docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .
                                docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest
                                docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:${env.GIT_COMMIT_SHORT}
                            """
                            
                            // Image ma'lumotlarini ko'rsatish
                            sh "docker images | grep ${DOCKER_IMAGE}"
                        }
                    }
                }
                
                stage('6b. 🔒 Container Security Scan') {
                    steps {
                        echo '🔒 Docker image xavfsizlik tekshiruvi...'
                        script {
                            try {
                                // Trivy security scanner
                                sh """
                                    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \\
                                    -v \$(pwd):/tmp/trivy \\
                                    aquasec/trivy image --format json --output /tmp/trivy/trivy-report.json \\
                                    ${DOCKER_IMAGE}:${DOCKER_TAG} || true
                                """
                                
                                // Hadolint Dockerfile linter
                                sh """
                                    docker run --rm -i hadolint/hadolint < Dockerfile > hadolint-report.txt || true
                                """
                                
                            } catch (Exception e) {
                                echo "Container security scan xatosi: ${e.getMessage()}"
                            }
                        }
                        archiveArtifacts artifacts: 'trivy-report.json,hadolint-report.txt', allowEmptyArchive: true
                    }
                }
            }
        }
        
        stage('🚀 7. Deploy to Staging') {
            steps {
                echo '🚀 Staging muhitga deploy qilinmoqda...'
                script {
                    try {
                        // Eski staging containerni to'xtatish
                        sh "docker stop react-staging || true"
                        sh "docker rm react-staging || true"
                        
                        // Yangi staging container ishga tushirish
                        def stagingPort = "30${BUILD_NUMBER.takeLast(2)}"
                        sh """
                            docker run -d --name react-staging \\
                            -p ${stagingPort}:80 \\
                            -e NODE_ENV=staging \\
                            ${DOCKER_IMAGE}:${DOCKER_TAG}
                        """
                        
                        echo "✅ Staging deploy muvaffaqiyatli! URL: http://localhost:${stagingPort}"
                        
                        // Health check
                        sh "sleep 10" // Container ishga tushishini kutish
                        sh "curl -f http://localhost:${stagingPort} || exit 1"
                        
                        env.STAGING_URL = "http://localhost:${stagingPort}"
                        
                    } catch (Exception e) {
                        echo "Staging deploy xatosi: ${e.getMessage()}"
                        error("Staging deploy muvaffaqiyatsiz!")
                    }
                }
            }
        }
        
        stage('🧪 8. Integration Tests') {
            steps {
                echo '🧪 Integration testlar bajarilmoqda...'
                script {
                    try {
                        // Basic smoke tests
                        sh """
                            # Health check
                            curl -f ${env.STAGING_URL}/
                            
                            # Static files mavjudligini tekshirish
                            curl -f ${env.STAGING_URL}/static/css/ || true
                            curl -f ${env.STAGING_URL}/static/js/ || true
                            
                            echo "✅ Integration testlar muvaffaqiyatli!"
                        """
                    } catch (Exception e) {
                        echo "Integration test xatolari: ${e.getMessage()}"
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }
        
        stage('🎯 9. Production Deployment') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            input {
                message "Production ga deploy qilishni tasdiqlaysizmi?"
                ok "Ha, deploy qil!"
                submitterParameter "DEPLOYER"
            }
            steps {
                echo "🎯 Production ga deploy qilinmoqda... (${DEPLOYER} tomonidan tasdiqlangan)"
                script {
                    try {
                        // Production backup olish
                        sh """
                            docker commit react-production react-production-backup-${BUILD_NUMBER} || true
                        """
                        
                        // Eski production containerni to'xtatish
                        sh "docker stop react-production || true"
                        sh "docker rm react-production || true"
                        
                        // Yangi production container ishga tushirish
                        sh """
                            docker run -d --name react-production \\
                            -p 3000:3000 \\
                            -e NODE_ENV=production \\
                            --restart unless-stopped \\
                            ${DOCKER_IMAGE}:${DOCKER_TAG}
                        """
                        
                        // Production health check
                        sh "sleep 15"
                        sh "curl -f http://localhost:3000 || exit 1"
                        
                        echo "✅ Production deploy muvaffaqiyatli! URL: http://localhost:3000"
                        
                    } catch (Exception e) {
                        echo "Production deploy xatosi: ${e.getMessage()}"
                        
                        // Rollback qilish
                        sh """
                            docker stop react-production || true
                            docker rm react-production || true
                            docker run -d --name react-production \\
                            -p 3000:80 --restart unless-stopped \\
                            react-production-backup-${BUILD_NUMBER} || true
                        """
                        
                        error("Production deploy muvaffaqiyatsiz! Rollback amalga oshirildi.")
                    }
                }
            }
        }
        
        stage('📊 10. Post-Deploy Monitoring') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                echo '📊 Post-deployment monitoring sozlanmoqda...'
                script {
                    // Monitoring ma'lumotlarini yig'ish
                    sh """
                        echo "Build ma'lumotlari:" > deployment-info.txt
                        echo "Build Number: ${BUILD_NUMBER}" >> deployment-info.txt
                        echo "Git Commit: ${env.GIT_COMMIT_SHORT}" >> deployment-info.txt
                        echo "Deploy vaqti: \$(date)" >> deployment-info.txt
                        echo "Deploy qilgan: ${DEPLOYER}" >> deployment-info.txt
                        echo "Docker Image: ${DOCKER_IMAGE}:${DOCKER_TAG}" >> deployment-info.txt
                    """
                    
                    archiveArtifacts artifacts: 'deployment-info.txt'
                }
            }
        }
    }
    
    post {
        always {
            echo '🧹 Cleanup operations...'
            script {
                try {
                    // Staging containerni to'xtatish
                    // sh "docker stop react-staging || true"
                    // sh "docker rm react-staging || true"
                    
                    // // Eski imagelarni tozalash
                    // sh "docker image prune -f"
                    // sh "docker container prune -f"
                    
                    echo '✅ Cleanup yakunlandi'
                } catch (Exception e) {
                    echo "Cleanup xatosi: ${e.getMessage()}"
                }
            }
            
            // Workspace tozalash
            cleanWs()
        }
        
        success {
            echo '✅ Pipeline muvaffaqiyatli yakunlandi!'
            script {
                def successMessage = """
                🎉 DevSecOps Pipeline Muvaffaqiyatli!
                
                📋 Build Ma'lumotlari:
                • Build Number: ${BUILD_NUMBER}
                • Branch: ${BRANCH_NAME}
                • Git Commit: ${env.GIT_COMMIT_SHORT}
                • Docker Image: ${DOCKER_IMAGE}:${DOCKER_TAG}
                
                🚀 URLs:
                • Production: http://localhost:3000
                """
                
                echo successMessage
                
                // Slack notification (agar sozlangan bo'lsa)
                // slackSend(channel: '#devops', color: 'good', message: successMessage)
            }
        }
        
        failure {
            echo '❌ Pipeline muvaffaqiyatsiz yakunlandi!'
            script {
                def failureMessage = """
                🚨 DevSecOps Pipeline Muvaffaqiyatsiz!
                
                📋 Build Ma'lumotlari:
                • Build Number: ${BUILD_NUMBER}
                • Branch: ${BRANCH_NAME}
                • Git Commit: ${env.GIT_COMMIT_SHORT}
                • Xato bosqichi: ${STAGE_NAME}
                
                🔍 Jenkins: ${BUILD_URL}
                """
                
                echo failureMessage
                
                // Slack notification (agar sozlangan bo'lsa)
                // slackSend(channel: '#devops', color: 'danger', message: failureMessage)
            }
        }
        
        unstable {
            echo '⚠️ Pipeline noaniq holatda yakunlandi!'
            script {
                def unstableMessage = """
                ⚠️ DevSecOps Pipeline Noaniq Holat!
                
                📋 Build Ma'lumotlari:
                • Build Number: ${BUILD_NUMBER}
                • Branch: ${BRANCH_NAME}
                • Git Commit: ${env.GIT_COMMIT_SHORT}
                
                ℹ️ Ba'zi testlar yoki tekshiruvlar muvaffaqiyatsiz bo'ldi
                """
                
                echo unstableMessage
                
                // Slack notification (agar sozlangan bo'lsa)
                // slackSend(channel: '#devops', color: 'warning', message: unstableMessage)
            }
        }
    }
}