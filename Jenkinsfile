pipeline {
    agent any
    environment {
        ANSIBLE_CONFIG = "${WORKSPACE}/infra/ansible/ansible.cfg"
    }
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Build') {
            steps {
                ansiblePlaybook(playbook: 'infra/ansible/playbooks/build.yml',
                                inventory: 'infra/ansible/hosts',
                                vaultCredentialsId: 'VAULT_PASSWORD_FILE')
            }
        }
        stage('Docker') {
            steps {
                ansiblePlaybook(
                  playbook: 'infra/ansible/playbooks/docker.yml',
                  inventory: 'infra/ansible/hosts',
                  vaultCredentialsId: 'VAULT_PASSWORD_FILE'
                )
            }
        }
        stage('Security Scan') {
            steps {
                ansiblePlaybook(playbook: 'infra/ansible/playbooks/trivy.yml',
                                inventory: 'infra/ansible/hosts',
                                vaultCredentialsId: 'VAULT_PASSWORD_FILE')
            }
        }
    }
    post {
        success { echo 'CI/CD pipeline completed successfully.' }
        failure { echo 'CI/CD pipeline failed.' }
    }
}
