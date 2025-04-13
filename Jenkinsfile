pipeline {
    agent any

    environment {
        ANSIBLE_CONFIG = 'infra/ansible/ansible.cfg'
        PLAYBOOKS_DIR = 'infra/ansible/playbooks'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout([$class: 'GitSCM', 
                          branches: [[name: '*/master']],
                          extensions: [],
                          userRemoteConfigs: [[url: 'https://github.com/melekbadreddine/otel-mastery']]
                        ])
            }
        }

        stage('Setup Environment') {
            steps {
                sh '''
                    echo "Installing required dependencies..."
                    sudo apt-get update -qq
                    sudo apt-get install -y python3-pip
                    pip3 install ansible
                    ansible-galaxy collection install community.docker
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                dir(env.PLAYBOOKS_DIR) {
                    ansiblePlaybook(
                        playbook: 'install-dependencies.yml',
                        inventory: '../hosts',
                        extras: '-v'
                    )
                }
            }
        }

        stage('Build Applications') {
            steps {
                dir(env.PLAYBOOKS_DIR) {
                    ansiblePlaybook(
                        playbook: 'build.yml',
                        inventory: '../hosts',
                        extras: '--tags=build'
                    )
                }
            }
        }

        stage('Build & Push Docker Images') {
            environment {
                DOCKERHUB_CREDS = credentials('dockerhub-creds')
            }
            steps {
                dir(env.PLAYBOOKS_DIR) {
                    ansiblePlaybook(
                        playbook: 'docker-images.yml',
                        inventory: '../hosts',
                        extras: '--tags=build-push',
                        extraVars: [
                            dockerhub_pass: "${env.DOCKERHUB_CREDS_PSW}"
                        ]
                    )
                }
            }
        }
    }

    post {
        always {
            cleanWs()
            script {
                echo "Cleaning up workspace..."
            }
        }
        success {
            slackSend color: "good", message: "Build succeeded: ${env.JOB_NAME} ${env.BUILD_NUMBER}"
        }
        failure {
            slackSend color: "danger", message: "Build failed: ${env.JOB_NAME} ${env.BUILD_NUMBER}"
        }
    }
}