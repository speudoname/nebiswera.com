import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getQuizFailedKA(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `არ დანებდეთ! სცადეთ ტესტი ხელახლა ${vars.courseTitle}-ში`,
    previewText: `თქვენ შეგიძლიათ! გადახედეთ მასალას და სცადეთ ხელახლა.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">გააგრძელეთ!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">გამარჯობა ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            თქვენ კარგი მცდელობა გააკეთეთ ტესტზე <strong>${vars.quizTitle}</strong>, მაგრამ ამჯერად ვერ მიაღწიეთ ჩასაბარებელ ქულას.
          </p>
          <div style="background-color: #F3F4F6; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center;">
            <p style="color: #6B7280; font-size: 14px; margin: 0 0 5px 0;">თქვენი ქულა</p>
            <p style="color: #374151; font-size: 48px; font-weight: bold; margin: 0;">${vars.quizScore}%</p>
            <p style="color: #6B7280; font-size: 14px; margin: 10px 0 0 0;">ჩასაბარებელი ქულა: ${vars.passingScore}%</p>
            ${vars.attemptsRemaining !== undefined ? `
            <p style="color: #4F46E5; font-size: 14px; margin: 15px 0 0 0; font-weight: 600;">
              ${vars.attemptsRemaining > 0 ? `დარჩენილია ${vars.attemptsRemaining} მცდელობა` : 'მცდელობები ამოიწურა'}
            </p>
            ` : ''}
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            <strong>არ დაიდარდოთ!</strong> ეს სასწავლო პროცესის ნაწილია. აი, რას გირჩევთ:
          </p>
          <ul style="color: #374151; font-size: 16px; line-height: 1.8;">
            <li>ყურადღებით გადახედეთ გაკვეთილის მასალას</li>
            <li>გააკეთეთ ჩანაწერები ძირითად კონცეფციებზე</li>
            <li>სცადეთ ტესტი ხელახლა, როცა მზად იქნებით</li>
          </ul>
          ${vars.attemptsRemaining === undefined || vars.attemptsRemaining > 0 ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.courseUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              გადახედეთ და სცადეთ ხელახლა
            </a>
          </div>
          ` : ''}
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            გახსოვდეთ, ყველა ექსპერტი ოდესღაც დამწყები იყო. თქვენ შეგიძლიათ!
          </p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            თქვენ მიიღეთ ეს შეტყობინება, რადგან დარეგისტრირდით კურსზე Nebiswera-ზე.
          </p>
        </div>
      </div>
    `,
    text: `გამარჯობა ${vars.firstName},

თქვენ კარგი მცდელობა გააკეთეთ ტესტზე ${vars.quizTitle}, მაგრამ ამჯერად ვერ მიაღწიეთ ჩასაბარებელ ქულას.

თქვენი ქულა: ${vars.quizScore}%
ჩასაბარებელი ქულა: ${vars.passingScore}%
${vars.attemptsRemaining !== undefined ? `დარჩენილი მცდელობები: ${vars.attemptsRemaining}` : ''}

არ დაიდარდოთ! ეს სასწავლო პროცესის ნაწილია. აი, რას გირჩევთ:
- ყურადღებით გადახედეთ გაკვეთილის მასალას
- გააკეთეთ ჩანაწერები ძირითად კონცეფციებზე
- სცადეთ ტესტი ხელახლა, როცა მზად იქნებით

${vars.attemptsRemaining === undefined || vars.attemptsRemaining > 0 ? `გადახედეთ და სცადეთ ხელახლა: ${vars.courseUrl}` : ''}

გახსოვდეთ, ყველა ექსპერტი ოდესღაც დამწყები იყო. თქვენ შეგიძლიათ!`,
  }
}
