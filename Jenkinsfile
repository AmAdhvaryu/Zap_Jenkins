// Define the target URLs and other parameters
def targets = ['https://qa2.criticalmention.com']
def gitUrl = "https://github.com/AmAdhvaryu/Zap_Jenkins.git"
def gitBranch = "origin/main"

// Define the ZAP API port
def zapApiPort = 2375

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
        stage('Scanning') {
            steps {
                script {
                    def zapContainerName = "zap_${env.BUILD_NUMBER}"
                    echo "Starting ZAP Docker container: ${zapContainerName}"
                    
                    // Start the ZAP Docker container
                    sh """
                        docker run --name ${zapContainerName} -d owasp/zap2docker-stable zap.sh -daemon \
                        -port ${zapApiPort} \
                        -host 0.0.0.0 \
                        -config api.disablekey=true \
                        -config scanner.attackOnStart=true \
                        -config scanner.delayInMs=${params.DELAY_IN_MS} \
                        -config scanner.maxScanDurationInMins=${params.MAX_SCAN_DURATION_IN_MINS} \
                        -config scanner.threadPerHost=2 \
                        -config view.mode=attack \
                        -config connection.dnsTtlSuccessfulQueries=-1 \
                        -config api.addrs.addr.name=.* \
                        -config api.addrs.addr.regex=true \
                        -addoninstall ascanrulesBeta \
                        -addoninstall pscanrulesBeta \
                        -addoninstall alertReport
                    """
                    
                    // Copy context files into the container
                    if (params.ZAP_USE_CONTEXT_FILE) {
                        echo "Using ZAP context file for authentication"
                        def contextFileName = "${params.ZAP_TARGET}.context"
                        def defaultContextFileName = "default.context"
                        
                        // Check if the context file exists in the repository
                        if (fileExists("./contexts/${contextFileName}")) {
                            sh """
                                docker cp ./contexts/${contextFileName} ${zapContainerName}:/home/zap/${contextFileName}
                            """
                        } else {
                            echo "Context file '${contextFileName}' not found in ./contexts. Using default context."
                            params.ZAP_USE_CONTEXT_FILE = false
                        }
                        
                        // Always copy the default context file
                        sh """
                            docker cp ./contexts/${defaultContextFileName} ${zapContainerName}:/home/zap/${defaultContextFileName}
                        """
                    } else {
                        echo "Running scan with default context."
                        params.ZAP_USE_CONTEXT_FILE = false
                    }
                    
                    // Wait for ZAP to be ready
                    sh """
                        docker exec ${zapContainerName} zap-cli -v -p ${zapApiPort} status -t 120
                    """
                    
                    // Perform the ZAP scan
                    def targetUrl = params.ZAP_USE_CONTEXT_FILE ? "https://${params.ZAP_TARGET}" : "https://${params.ZAP_TARGET}/" // Adjust the URL based on context usage
                    sh """
                        docker exec ${zapContainerName} zap-cli -v -p ${zapApiPort} ${params.ZAP_USE_CONTEXT_FILE ? "open-url" : "open" } ${targetUrl}
                        docker exec ${zapContainerName} zap-cli -v -p ${zapApiPort} spider -c ${params.ZAP_TARGET} ${targetUrl}
                        docker exec ${zapContainerName} zap-cli -v -p ${zapApiPort} active-scan -c ${params.ZAP_TARGET} --recursive ${targetUrl}
                    """
                    
                    // Generate and copy reports
                    sh """
                        docker exec ${zapContainerName} zap-cli -p ${zapApiPort} report -o /home/zap/report.html -f html
                        docker cp ${zapContainerName}:/home/zap/report.html ./results/
                        docker exec ${zapContainerName} zap-cli -p ${zapApiPort} report -o /home/zap/report.xml -f xml
                        docker cp ${zapContainerName}:/home/zap/report.xml ./results/
                        docker exec ${zapContainerName} zap-cli -p ${zapApiPort} alerts --alert-level "${params.ZAP_ALERT_LVL}" -f json > ./results/report.json || true
                    """
                    
                    // Check for alerts and mark the Jenkins job as unstable if alerts are found
                    def alertCount = sh(script: "docker exec ${zapContainerName} zap-cli -p ${zapApiPort} alerts --alert-level ${params.ZAP_ALERT_LVL} -f json | jq length", returnStatus: true)
                    if (alertCount.toInteger() > 0) {
                        currentBuild.result = 'UNSTABLE'
                        error("Vulnerabilities detected: Alert count=${alertCount}")
                    }
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
                docker container rm -f ${zapContainerName} || true
            """
        }
    }
}
