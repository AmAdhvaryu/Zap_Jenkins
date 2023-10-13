// Define the target URLs and other parameters
def targets = ['https://qa2.criticalmention.com']
def gitUrl = "https://github.com/AmAdhvaryu/Zap_Jenkins.git"
def gitBranch = "origin/main"
// Define a function for installing or upgrading zapcli
def installOrUpgradeZapcli() {
 // def pipInstallCommand = 'pip3 install zapcli -t /var/lib/jenkins'
 //    def exitCode = sh(script: pipInstallCommand, returnStatus: true)
 //    if (exitCode == 0) {
 //        echo 'zapcli installation or upgrade successful.'
 //    } else {
 //        error 'Failed to install or upgrade zapcli.'
 //    }
}
pipeline {
    agent any
    parameters {
        choice(name: 'ZAP_TARGET', choices: targets, description: 'Website to Scan')
        choice(name: 'ZAP_ALERT_LVL', choices: ['High', 'Medium', 'Low', 'Informational'], description: 'Alert Level (High, Medium, Low, Informational)')
        booleanParam(name: 'ZAP_USE_CONTEXT_FILE', defaultValue: true, description: 'Use ZAP context file for authentication')
        string(name: 'DELAY_IN_MS', defaultValue: '0', description: 'Delay between requests during scanning (milliseconds)')
        string(name: 'MAX_SCAN_DURATION_IN_MINS', defaultValue: '300', description: 'Maximum scan duration in minutes')
    }
    stages {
        stage('Install or Upgrade zapcli') {
            steps {
                script {
                    installOrUpgradeZapcli()
                }
            }
        }
    stage('Running Docker Container'){
            steps {
                script {
                echo "Starting ZAP Docker container: owasp"
                 sh """docker run -d --name owasp -p 2375:2375 -v /var/lib/jenkins:/var/lib/jenkins -w /var/lib/jenkins owasp/zap2docker-stable zap.sh -daemon -host 0.0.0.0 -port 2375  -config api.key=12345 -config api.addrs.addr.name=.* -config api.addrs.addr.regex=true """
                 // Wait for a brief moment to allow the container to fully start
                          sleep(time: 30, unit: 'SECONDS')
                    
                          echo "Printing container logs:"
                          sh '''
                          docker logs owasp
                          '''
        
                }
            }
        }
         stage('Prepare wrk directory') {
             steps {
                 script {
                     sh '''
                     docker exec owasp mkdir /zap/wrk
                     '''
             echo "The directory is created"
                 }
             }
        }
        stage('Install Zap-cli'){
        steps{
            script{
                //'docker exec owasp pip3 install zapcli'
                 sh 'docker exec -i owasp sh -c "mkdir -p /home/zap/.local/bin"'
                sh 'docker exec -i owasp sh -c "pip3 install zapcli"'
            }
        }
    }
        stage('Getting Zap file'){
            steps {
                script {
                
                  echo "Using ZAP context file for authentication"
                  sh """ docker cp contexts/default.context owasp:/zap/wrk/default """
            echo "The context file is copied"
              sh "docker exec owasp ls /zap/wrk/default"
                }
            }
        }
        stage('scanning'){
            steps{
                script {
                      def containerID = sh(script: 'docker ps -q -f name=owasp', returnStdout: true).trim()
                    
                                   echo "Docker container ID: ${containerID}"
        sh """ docker exec ${containerID} /home/zap/.local/bin/zap-cli -v -p 2375 context import /zap/wrk/default """

                    echo "scanning the url"
              sh """docker exec ${containerID} zap-cli -v -p 8171 scan https://${ZAP_TARGET}"""
             }
           }
        }
         stage('Publish'){
            steps {
                echo "Publishing ZAP scan reports"
                publishHTML([
                    allowMissing: true,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: './results',
                    reportFiles: 'report.html,report.xml,report.json',
                    reportName: 'Scan-Report',
                    reportTitles: 'HTML, XML, JSON'
                ])
            }
        }
    }
    post {
        always {
            echo "Cleaning up ZAP Docker container"
            sh 'docker container rm -f owasp || true'
        }
    }
}
