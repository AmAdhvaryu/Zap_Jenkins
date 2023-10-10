// Define the target URLs and other parameters
def targets = ['https://qa2.criticalmention.com']
def gitUrl = "https://github.com/AmAdhvaryu/Zap_Jenkins.git"
def gitBranch = "origin/main"
def zapApiPort = 2375

// Define a function for installing or upgrading zapcli
def installOrUpgradeZapcli() {
    def pipInstallCommand = 'pip install -U zapcli'
    def exitCode = sh(script: pipInstallCommand, returnStatus: true)

    if (exitCode == 0) {
        echo 'zapcli installation or upgrade successful.'
    } else {
        error 'Failed to install or upgrade zapcli.'
    }
}

// Define a function for starting the ZAP Docker container
def startZapContainer() {
    def zapContainerName = "owasp"
    echo "Starting ZAP Docker container: ${zapContainerName}"
    
    //def dockerCommand = """
    
                    sh """docker run -d --name owasp -p 2375:2375 -v /var/lib/jenkins:/var/lib/jenkins -w /var/lib/jenkins owasp/zap2docker-stable zap.sh -daemon -host 0.0.0.0 -port 2375  -config api.key=12345 -config api.addrs.addr.name=.* -config api.addrs.addr.regex=true """
                    
                    // Wait for a brief moment to allow the container to fully start
                    sleep(time: 60, unit: 'SECONDS')
                    
                    echo "Printing container logs:"
                    sh '''
                    docker logs owasp
                    '''
                    
                    sh '''
                    docker images
                    '''
                    
                    sh '''
                    docker ps
                    '''
        // docker run --name ${zapContainerName} -d owasp/zap2docker-stable zap.sh -daemon \
        // -port ${zapApiPort} \
        // -host 0.0.0.0 \
        // -config api.disablekey=true \
        // -config scanner.attackOnStart=true \
        // -config scanner.delayInMs=${params.DELAY_IN_MS} \
        // -config scanner.maxScanDurationInMins=${params.MAX_SCAN_DURATION_IN_MINS} \
        // -config scanner.threadPerHost=2 \
        // -config view.mode=attack \
        // -config connection.dnsTtlSuccessfulQueries=-1 \
        // -config api.addrs.addr.name=.* \
        // -config api.addrs.addr.regex=true \
        // -addoninstall ascanrulesBeta \
        // -addoninstall pscanrulesBeta \
        // -addoninstall alertReport
    // """
    
    // sh dockerCommand
    // return zapContainerName
}

// Define a function for copying context files into the container
def copyContextFiles(zapContainerName) {
    if (params.ZAP_USE_CONTEXT_FILE) {
        echo "Using ZAP context file for authentication"
        def contextFileName = "default.context"
        def defaultContextFileName = "default.context"
        
        if (fileExists("./contexts/${contextFileName}")) {
            sh "docker cp ./contexts/${contextFileName} ${zapContainerName}:/home/zap/${contextFileName}"
        } else {
            echo "Context file '${contextFileName}' not found in ./contexts. Using default context."
            params.ZAP_USE_CONTEXT_FILE = false
        }
        
        sh "docker cp ./contexts/${defaultContextFileName} ${zapContainerName}:/home/zap/${defaultContextFileName}"
    } else {
        echo "Running scan with default context."
        params.ZAP_USE_CONTEXT_FILE = false
    }
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
        stage('Scanning') {
            steps {
                script {
                    def zapContainerName = startZapContainer()
                    copyContextFiles(zapContainerName)
                    
                    // ... (rest of the scanning stage remains the same)
                }
            }
        }

        stage('Publish') {
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
            sh """
                docker container rm -f zap_29 || true
                docker container rm -f owasp || true
            """
        }
    }
}
