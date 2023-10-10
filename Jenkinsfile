def targets = ['https://qa2.criticalmention.com']
def gitUrl = "https://github.com/AmAdhvaryu/Zap_Jenkins.git"
def gitBranch = "origin/main"

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
                    def pipInstallCommand = 'pip install -U zapcli'
                    def exitCode = sh(script: pipInstallCommand, returnStatus: true)

                    if (exitCode == 0) {
                        echo 'zapcli installation or upgrade successful.'
                    } else {
                        error 'Failed to install or upgrade zapcli.'
                    }
                }
            }
        }
        stage('scanning') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    // starting container
                    echo "Starting ZAP Docker container: owasp"
                    sh """
                        docker run -d --name owasp -p 2375:2375 -v /var/lib/jenkins:/var/lib/jenkins -w /var/lib/jenkins owasp/zap2docker-stable zap.sh -daemon -host 0.0.0.0 -port 2375 -config api.key=12345 -config api.addrs.addr.name=.* -config api.addrs.addr.regex=true
                    """

                    // Wait for a brief moment to allow the container to fully start
                    sleep(time: 30, unit: 'SECONDS')

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

                    // copy context file into container if exists
                    if ([[ -f "./contexts/default.context" ]]) {
                        echo "context file found in contexts/default.context - Copying into container"
                        docker cp ./contexts/default.context owasp:/home/zap/$ZAP_TARGET
                        docker cp ./contexts/default.context owasp:/home/zap/default
                    } else {
                        echo "context file not found in contexts/default.context - Running scan with default context."
                        ZAP_USE_CONTEXT_FILE = "false"
                        docker cp ./contexts/default.context owasp:/home/zap/default
                    }

                    // wait for zap to be ready
                    docker exec owasp zap-cli -v -p 2375 status -t 120

                    // start the actual scan, with or without context file
                    if ([[ "\${ZAP_USE_CONTEXT_FILE}" == "true" ]]) {
                        docker exec owasp zap-cli -v -p 2375 context import /home/zap/$ZAP_TARGET
                        docker exec owasp zap-cli -v -p 2375 context info $ZAP_TARGET
                        // required to work around bug https://github.com/Grunny/zap-cli/issues/79
                        if ([[ -f "./contexts/default.context.exclude" ]]) {
                            echo "context exclude file found in contexts/default.context.exclude - applying."
                            cat ./contexts/\${ZAP_TARGET}.context.exclude | while read line || [[ -n $line ]];
                            do
                                docker exec owasp zap-cli -v -p 2375 exclude "\$line"
                            done
                        }
                        docker exec owasp zap-cli -v -p 2375 open-url https://$ZAP_TARGET
                        docker exec owasp zap-cli -v -p 2375 spider -c $ZAP_TARGET https://$ZAP_TARGET
                        docker exec owasp zap-cli -v -p 2375 active-scan -c $ZAP_TARGET --recursive https://$ZAP_TARGET
                    } else {
                        docker exec owasp zap-cli -v -p 2375 context import /home/zap/default
                        docker exec owasp zap-cli -v -p 2375 context info default
                        docker exec owasp zap-cli -v -p 2375 open-url https://$ZAP_TARGET
                        docker exec owasp zap-cli -v -p 2375 spider -c default https://$ZAP_TARGET
                        docker exec owasp zap-cli -v -p 2375 active-scan -c default --recursive https://$ZAP_TARGET
                    }

                    // generate report inside container
                    docker exec owasp zap-cli -p 2375 report -o /home/zap/report.html -f html
                    docker cp owasp:/home/zap/report.html ./results/
                    docker exec owasp zap-cli -p 2375 report -o /home/zap/report.xml -f xml
                    docker cp owasp:/home/zap/report.xml ./results/
                    // fetch alerts json
                    docker exec owasp zap-cli -p 2375 alerts --alert-level "Informational" -f json > ./results/report.json || true

                    // Check for alerts
                    ALERT_CNT = \$(docker exec owasp zap-cli -p 2375 alerts --alert-level $ZAP_ALERT_LVL -f json | jq length)

                    // mark Jenkins job yellow in case alerts were detected
                    if ([[ "\${ALERT_CNT}" -gt 0 ]]) {
                        echo "Vulnerabilities detected, Lvl=$ZAP_ALERT_LVL Alert count=\${ALERT_CNT}"
                        echo "Job is unstable..."
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }
        stage('publish') {
            steps {
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
            sh("""
                #!/bin/bash -eux
                docker container rm -f zap_${env.BUILD_NUMBER} || true
            """)
        }
    }
}
