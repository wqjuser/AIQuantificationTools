<#macro templates>
    <template id="errorTemplate">
        <div class="${properties.kcFormHelperTextClass}" aria-live="polite">
            <div class="${properties.kcInputHelperTextClass}">
                <div class="${properties.kcInputHelperTextItemClass} ${properties.kcError}">
                    <ul class="${properties.kcInputErrorMessageClass}"></ul>
                </div>
            </div>
        </div>
    </template>
    <template id="errorItemTemplate"><li></li></template>
</#macro>

<#macro script field="">
    <#if field?has_content && passwordRequired??>
        <script type="module">
            <#outputformat "JavaScript">
            import { validatePassword } from "${url.resourcesPath}/js/password-policy.js";

            const input = document.getElementById("${field}");
            const activePolicies = [
                { name: "length", policy: { value: ${passwordPolicies.length!-1}, error: ${msg('invalidPasswordMinLengthMessage')?c} } },
                { name: "maxLength", policy: { value: ${passwordPolicies.maxLength!-1}, error: ${msg('invalidPasswordMaxLengthMessage')?c} } },
                { name: "lowerCase", policy: { value: ${passwordPolicies.lowerCase!-1}, error: ${msg('invalidPasswordMinLowerCaseCharsMessage')?c} } },
                { name: "upperCase", policy: { value: ${passwordPolicies.upperCase!-1}, error: ${msg('invalidPasswordMinUpperCaseCharsMessage')?c} } },
                { name: "digits", policy: { value: ${passwordPolicies.digits!-1}, error: ${msg('invalidPasswordMinDigitsMessage')?c} } },
                { name: "specialChars", policy: { value: ${passwordPolicies.specialChars!-1}, error: ${msg('invalidPasswordMinSpecialCharsMessage')?c} } }
            ].filter(({ policy }) => policy.value !== -1);

            input?.addEventListener("change", (event) => {
                const errorContainer = document.getElementById("input-error-container-${field}");
                const template = document.querySelector("#errorTemplate").content.cloneNode(true);
                const errors = validatePassword(event.target.value, activePolicies);

                if (errors.length === 0) {
                    errorContainer.replaceChildren();
                    return;
                }

                const errorList = template.querySelector("ul");
                errors.forEach((error) => {
                    const row = document.querySelector("#errorItemTemplate").content.cloneNode(true);
                    row.querySelector("li").textContent = error;
                    errorList.appendChild(row);
                });
                errorContainer.replaceChildren(template);
            });
            </#outputformat>
        </script>
    </#if>
</#macro>
