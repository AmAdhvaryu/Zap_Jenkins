// Define the target URLs and other parameters
def targets = ['https://qa2.criticalmention.com']
def gitUrl = "https://github.com/AmAdhvaryu/Zap_Jenkins.git"
def gitBranch = "origin/main"
def gitCredId = '12345'
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
     stage('checkout'){
			steps{
				script {
                    currentBuild.displayName = env.BUILD_NUMBER + "_" + params.ZAP_TARGET + "--" + params.ZAP_ALERT_LVL
					cleanWs()     
				}
                // checkout
                checkout([
                    $class: 'GitSCM',
                    branches: [[
                        name: gitBranch
                    ]],
                    userRemoteConfigs: [[
                        credentialsId: gitCredId ,
                        url: gitUrl
                    ]]
                ])
			}
		}
    stage('Running Docker Container'){
            steps {
                script {
                echo "Starting ZAP Docker container: owasp"
                 sh """docker run -d --name owasp -p 2375:2375 -v /var/lib/jenkins:/var/lib/jenkins -w /var/lib/jenkins owasp/zap2docker-stable zap.sh -daemon -host 0.0.0.0 -port 2375  -config api.key=12345 -config api.addrs.addr.name=.* -config api.addrs.addr.regex=true """
                 // Wait for a brief moment to allow the container to fully start
                          sleep(time: 10, unit: 'SECONDS')
                    
                          echo "Printing container logs:"
                          sh '''
                          docker logs owasp
                          '''
			// Define the API key as an environment variable in this stage
                    env.API_KEY = '12345'
        
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
                 sh 'docker exec -i owasp sh -c "mkdir -p /zap/.local/bin"'
                sh 'docker exec -i owasp sh -c "pip3 install zapcli"'
            }
        }
    }
        stage('Getting Zap file'){
            steps {
                script {
			 def containerID = sh(script: 'docker ps -q -f name=owasp', returnStdout: true).trim()
                    
                                   echo "Docker container ID: ${containerID}"
                
                  echo "Using ZAP context file for authentication"
                  //sh """ docker cp contexts/default.context owasp:/zap/wrk/default """
            echo "The context file is copied"
              //sh "docker exec owasp ls /zap/wrk/default"
              sh "docker cp contexts/CmAuthtwo.context  ${containerID}:/zap/wrk/CmAuthtwo.context "
               sh "docker cp contexts/default.context  ${containerID}:/zap/wrk/default.context "
	       sh "docker cp CmAuthtwo.js  ${containerID}:/zap/wrk/CmAuthtwo.js "
			 sh "docker exec  ${containerID} ls /zap/wrk "
                }
            }
        }
        stage('scanning'){
            steps{
                script {
                       def containerID = sh(script: 'docker ps -q -f name=owasp', returnStdout: true).trim()
                    
                                    echo "Docker container ID: ${containerID}"
			 //sh "docker restart ${containerID} "
			//echo "Docker is restarted"
			 // Wait for a brief moment to allow the container to fully start
                          sleep(time: 10, unit: 'SECONDS')
			//sh "timeout 600 docker exec ${containerID} env PATH=\$PATH:/home/zap/.local/bin zap-cli start --start-options '-config api.key=12345'"

			// sh """
   //                 // docker exec ${containerID}  env PATH=$PATH:/home/zap/.local/bin zap-cli -v -p 2375 --api-key 12345 execute --script /zap/wrk/CmAuthtwo.js
   //                  //"""


    //sh "docker exec ${containerID}  env PATH=$PATH:/home/zap/.local/bin zap-cli -v -cmd /zap/wrk/CmAuthtwo"
     //sh "docker exec ${containerID}  env PATH=$PATH:/home/zap/.local/bin zap-cli -p 2375 script.load /zap/wrk/CmAuthtwo.js "
     //sh "docker exec ${containerID} curl -X POST 0.0.0.0:2375/JSON/script/action/load --api-key 12345 -d 'scriptName=CmAuthtwo.js' -d 'scriptType=Zap' "
 //sh " docker exec ${containerID} curl -X POST -H "api-key: 12345" -d "scriptName=CmAuthtwo.js" -d "scriptType=Zap" http://0.0.0.0:2375/JSON/script/action/load "

 def apiKey = "12345"
                    def scriptName = "CmAuthtwo.js"
                    def scriptType = "Zap"

                    // Use the 'sh' step to execute the curl command
                    def curlCommand = """curl -X POST -H 'api-key: ${apiKey}' -d 'scriptName=${scriptName}' -d 'scriptType=${scriptType}' http://0.0.0.0:2375/JSON/script/action/load"""
                    def result = sh(script: curlCommand, returnStatus: true)




			
    //sh "docker exec ${containerID}  env PATH=$PATH:/home/zap/.local/bin zap-cli script execute /zap/wrk/CmAuthtwo.js "
			//sh "docker exec ${containerID} env PATH=$PATH:/home/zap/.local/bin zap-cli --api-key ${env.API_KEY} import -context CmAuthtwo.context -scripts CmAuthtwo.js "


 //sh " docker exec ${containerID} env PATH=$PATH:/home/zap/.local/bin zap-cli -v -p 2375 --api-key ${env.API_KEY} import -context CmAuthtwo.context -script CmAuthtwo.script "
  //sh """ docker exec ${containerID} env PATH=$PATH:/home/zap/.local/bin zap-cli -v -p 2375 --api-key ${env.API_KEY} import /zap/wrk/CmAuthtwo """
 sh """ docker exec ${containerID} env PATH=$PATH:/home/zap/.local/bin zap-cli -v -p 2375 --api-key ${env.API_KEY} context import /zap/wrk/CmAuthtwo.context """
 //sh """ docker exec ${containerID} env PATH=$PATH:/home/zap/.local/bin zap-cli -v -p 2375 context info cm.context """
//sh """ docker exec owasp env PATH=$PATH:/home/zap/.local/bin zap-cli -v -p 2375 --api-key 12345 context import /zap/wrk/default.context """
                 

                    echo "scanning the url"
              //sh """ docker exec ${containerID} env PATH=$PATH:/home/zap/.local/bin zap-cli -v -p 2375 scan https://${ZAP_TARGET} """
	     //sh """ docker exec ${containerID} env PATH=$PATH:/home/zap/.local/bin zap-cli -v -p 2375 quick-scan --spider -s xss,sqlInjection https://qa2.criticalmention.com """
			sh""" docker exec ${containerID} env PATH=$PATH:/home/zap/.local/bin zap-cli -v -p 2375 open-url $ZAP_TARGET """
                        sh"""    docker exec ${containerID} env PATH=$PATH:/home/zap/.local/bin zap-cli -v -p 2375 spider -c $ZAP_TARGET $ZAP_TARGET """

			
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
		echo "Printing container logs:"
                          sh '''
                          docker logs owasp
                          '''
            echo "Cleaning up ZAP Docker container"
            sh 'docker container rm -f owasp || true'
        }
    }
}
