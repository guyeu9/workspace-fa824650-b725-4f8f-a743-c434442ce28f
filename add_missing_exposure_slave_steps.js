const fs = require('fs');
const path = require('path');

function addMissingExposureSlaveSteps(inputPath, outputPath) {
  console.log(`Reading file: ${inputPath}`);
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  console.log(`Original file contains ${data.branches ? data.branches.length : 0} branches`);
  
  const branches = data.branches || [];
  
  const newBranches = [
    {
      branch_id: "slave_step5",
      branch_title: "曝光奴挑战 - 步骤5：在公共场所停留",
      content: "你在公共场所停留片刻，观察周围的环境。这种短暂的停顿让你更加紧张，心跳加速，鸡巴在期待中微微发硬。你注意到周围人的目光，感受到被注视的羞辱与兴奋。",
      options: [
        {
          option_id: "choice_slave_5_1",
          option_text: "1. 观察环境30秒",
          target_branch_id: "slave_step6",
          effect: "仔细观察周围的人流和环境细节，感受被注视的快感。"
        },
        {
          option_id: "choice_slave_5_2",
          option_text: "2. 调整姿势，增加暴露",
          target_branch_id: "slave_step6",
          effect: "稍微调整站立姿势，让身体曲线更加明显，增加暴露效果。"
        },
        {
          option_id: "choice_slave_5_3",
          option_text: "3. 继续走动",
          target_branch_id: "slave_step7",
          effect: "开始在公共场所走动，让更多人注意到你。"
        }
      ]
    },
    {
      branch_id: "slave_step6",
      branch_title: "曝光奴挑战 - 步骤6：听他人声音",
      content: "你在公共场所走动时，听到周围人的说话声和脚步声。这些声音让你更加紧张，同时也让你意识到自己正在被观察。鸡巴在期待中微微发硬，暴露的快感与羞耻感交织在一起。",
      options: [
        {
          option_id: "choice_slave_6_1",
          option_text: "1. 适当躲避",
          target_branch_id: "slave_step7",
          effect: "听到声音时，选择稍微躲避人群，减少被发现的概率。"
        },
        {
          option_id: "choice_slave_6_2",
          option_text: "2. 继续暴露",
          target_branch_id: "slave_step7",
          effect: "不躲避，继续在人群中走动，享受被注视的快感。"
        }
      ]
    },
    {
      branch_id: "slave_step7",
      branch_title: "曝光奴挑战 - 步骤7：完成行动",
      content: "你在公共场所完成了一系列行动后，停下来记录自己的感受。心跳加速，身体发热，鸡巴完全发硬。你感受到前所未有的羞辱与兴奋，这种极限暴露的体验让你欲罢不能。",
      options: [
        {
          option_id: "choice_slave_7_1",
          option_text: "1. 记录感受",
          target_branch_id: "slave_step8",
          effect: "在心中默默记录刚才的经历和感受，加深羞辱与兴奋的记忆。"
        },
        {
          option_id: "choice_slave_7_2",
          option_text: "2. 继续行动",
          target_branch_id: "slave_step8",
          effect: "调整心态，继续进行更多的暴露行动。"
        }
      ]
    },
    {
      branch_id: "slave_step8",
      branch_title: "曝光奴挑战 - 步骤8：安全离开",
      content: "你在公共场所完成了所有行动，准备安全离开。整理好衣物，检查周围环境，确保没有人注意到你的异常。鸡巴还在微微发硬，回味刚才的刺激体验。",
      options: [
        {
          option_id: "choice_slave_8_1",
          option_text: "1. 整理衣物",
          target_branch_id: "slave_step9",
          effect: "仔细整理好所有衣物，确保没有遗漏。"
        },
        {
          option_id: "choice_slave_8_2",
          option_text: "2. 检查环境",
          target_branch_id: "slave_step9",
          effect: "观察周围环境，确认安全后再离开。"
        },
        {
          option_id: "choice_slave_8_3",
          option_text: "3. 离开场所",
          target_branch_id: "slave_step10",
          effect: "安全离开公共场所，准备下一步挑战。"
        }
      ]
    },
    {
      branch_id: "slave_step9",
      branch_title: "曝光奴挑战 - 步骤9：准备高级挑战",
      content: "你安全离开了公共场所，但心中的羞辱与兴奋感还在燃烧。鸡巴依然发硬，暴露的欲望没有消退。你开始思考更高级的挑战，准备迎接下一次更刺激的冒险。",
      options: [
        {
          option_id: "choice_slave_9_1",
          option_text: "1. 回到任务中心",
          target_branch_id: "task_center",
          status_changes: [
            { attribute: "exposure", operation: "=", value: 50 },
            { attribute: "shame", operation: "=", value: 40 },
            { attribute: "excitement", operation: "=", value: 60 }
          ],
          effect: "完成一日挑战，状态大幅提升，准备迎接更高级的挑战。"
        },
        {
          option_id: "choice_slave_9_2",
          option_text: "2. 立即开始新挑战",
          target_branch_id: "exposure_slave_day",
          status_changes: [
            { attribute: "exposure", operation: "=", value: 60 },
            { attribute: "shame", operation: "=", value: 50 },
            { attribute: "excitement", operation: "=", value: 70 }
          ],
          effect: "立即开始新的一日挑战，追求更高的刺激。"
        }
      ]
    },
    {
      branch_id: "slave_step10",
      branch_title: "曝光奴挑战 - 步骤10：结束一日挑战",
      content: "你完成了一整天的曝光奴挑战，身心俱疲。鸡巴在兴奋中颤抖，身体在羞辱中发热。这是一次难忘的经历，你感受到了前所未有的羞辱与兴奋的极限。虽然身体疲惫，但内心充满了成就感。",
      options: [
        {
          option_id: "choice_slave_10_1",
          option_text: "1. 回到任务中心",
          target_branch_id: "task_center",
          status_changes: [
            { attribute: "exposure", operation: "=", value: 70 },
            { attribute: "shame", operation: "=", value: 60 },
            { attribute: "excitement", operation: "=", value: 80 }
          ],
          effect: "完成一日挑战，状态达到新高！准备迎接更高级的挑战。"
        },
        {
          option_id: "choice_slave_10_2",
          option_text: "2. 结束冒险",
          target_branch_id: "task_center",
          end_game: true,
          effect: "结束本次冒险，保存你的成就。"
        }
      ]
    }
  ];
  
  const existingBranchIds = new Set(branches.map(b => b.branch_id));
  const branchesToAdd = newBranches.filter(b => !existingBranchIds.has(b.branch_id));
  
  console.log(`Adding ${branchesToAdd.length} missing exposure slave steps`);
  
  data.branches = [...branches, ...branchesToAdd];
  
  console.log(`Saving file to: ${outputPath}`);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
  
  console.log("Add missing exposure slave steps complete!");
  
  console.log("\n=== Add Statistics ===");
  console.log(`Total branches: ${data.branches.length}`);
  const totalOptions = data.branches.reduce((sum, b) => sum + (b.options ? b.options.length : 0), 0);
  console.log(`Total options: ${totalOptions}`);
  console.log(`Missing steps added: ${branchesToAdd.length}`);
}

const inputFile = path.join(__dirname, 'public', '网调任务合集-完整版-v7.json');
const outputFile = path.join(__dirname, 'public', '网调任务合集-完整版-v8.json');

addMissingExposureSlaveSteps(inputFile, outputFile);
