import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getEnrollmentNudgeKA(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `მზად ხართ დაიწყოთ ${vars.courseTitle}?`,
    previewText: `თქვენი კურსი გელოდებათ. გადადგით პირველი ნაბიჯი დღესვე!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">თქვენი კურსი გელოდებათ!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">გამარჯობა ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            შევნიშნეთ, რომ დარეგისტრირდით კურსზე <strong>${vars.courseTitle}</strong>, მაგრამ ჯერ არ დაგიწყიათ.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            პირველი გაკვეთილი მხოლოდ ერთი დაწკაპუნებით გაშვრებულია. რატომ არ დაუთმობთ რამდენიმე წუთს დასაწყებად?
          </p>
          <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px 20px; margin: 20px 0;">
            <p style="color: #92400E; font-size: 14px; margin: 0;">
              <strong>რჩევა:</strong> დაწყება ყველაზე რთულია. დღეს თუნდაც 10 წუთი იმპულსს შექმნის!
            </p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.courseUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              დაიწყეთ პირველი გაკვეთილი
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            ჩვენ აქ ვართ თქვენი სასწავლო მოგზაურობის მხარდასაჭერად!
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

შევნიშნეთ, რომ დარეგისტრირდით კურსზე ${vars.courseTitle}, მაგრამ ჯერ არ დაგიწყიათ.

პირველი გაკვეთილი მხოლოდ ერთი დაწკაპუნებით გაშვრებულია. რატომ არ დაუთმობთ რამდენიმე წუთს დასაწყებად?

რჩევა: დაწყება ყველაზე რთულია. დღეს თუნდაც 10 წუთი იმპულსს შექმნის!

დაიწყეთ პირველი გაკვეთილი: ${vars.courseUrl}

ჩვენ აქ ვართ თქვენი სასწავლო მოგზაურობის მხარდასაჭერად!`,
  }
}
