pipeline {
    agent any

    environment {
        ANSIBLE_CONFIG = 'infra/ansible/ansible.cfg'
        PLAYBOOKS_DIR = 'infra/ansible/playbooks'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir(env.PLAYBOOKS_DIR) {
                    ansiblePlaybook(
                        playbook: 'install-dependencies.yml',
                        inventory: '../hosts'
                    )
                }
            }
        }

        stage('Build Applications') {
            steps {
                dir(env.PLAYBOOKS_DIR) {
                    ansiblePlaybook(
                        playbook: 'build.yml',
                        inventory: '../hosts'
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
        }
    }
}
