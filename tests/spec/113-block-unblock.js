import {
  accountProfileFollowButton,
  accountProfileFollowedBy, accountProfileMoreOptionsButton, communityNavButton, getNthSearchResult,
  getNthStatus, getNthStatusOptionsButton, getNthDialogOptionsOption, getUrl, modalDialog
} from '../utils'
import { Selector as $ } from 'testcafe'
import { loginAsFoobar } from '../roles'
import { postAs, unfollowAs } from '../serverActions'

fixture`113-block-unblock.js`
  .page`http://localhost:4002`

test('Can block and unblock an account from a status', async t => {
  const post = 'a very silly statement that should probably get me blocked'
  await postAs('admin', post)
  await loginAsFoobar(t)
  await t
    .expect(getNthStatus(1).innerText).contains(post, { timeout: 30000 })
    .click(getNthStatusOptionsButton(1))
    .expect(getNthDialogOptionsOption(1).innerText).contains('Unfollow @admin')
    .expect(getNthDialogOptionsOption(2).innerText).contains('Block @admin')
    .click(getNthDialogOptionsOption(2))
    .expect(modalDialog.exists).notOk()
    .click(communityNavButton)
    .click($('a[href="/blocked"]'))
    .expect(getNthSearchResult(1).innerText).contains('@admin')
    .click(getNthSearchResult(1))
    .expect(getUrl()).contains('/accounts/1')
    .expect(accountProfileFollowedBy.innerText).match(/blocked/i)
    .expect(accountProfileFollowButton.getAttribute('aria-label')).eql('Unblock')
    .expect(accountProfileFollowButton.getAttribute('title')).eql('Unblock')
    .expect(accountProfileFollowButton.getAttribute('aria-pressed')).eql(undefined)
    .click(accountProfileFollowButton)
    .expect(accountProfileFollowedBy.innerText).contains('')
    .expect(accountProfileFollowButton.getAttribute('aria-label')).eql('Follow')
    .expect(accountProfileFollowButton.getAttribute('title')).eql('Follow')
    .expect(accountProfileFollowButton.getAttribute('aria-pressed')).eql('false')
    .click(accountProfileFollowButton)
    .expect(accountProfileFollowButton.getAttribute('aria-label')).eql('Follow')
    .expect(accountProfileFollowButton.getAttribute('title')).eql('Unfollow')
    .expect(accountProfileFollowButton.getAttribute('aria-pressed')).eql('true')
})

test('Can block and unblock an account from the account profile page', async t => {
  await unfollowAs('foobar', 'baz') // reset
  await loginAsFoobar(t)
  await t
    .navigateTo('/accounts/5')
    .expect(accountProfileFollowButton.getAttribute('aria-label')).eql('Follow')
    .click(accountProfileMoreOptionsButton)
    .expect(getNthDialogOptionsOption(1).innerText).contains('Mention @baz')
    .expect(getNthDialogOptionsOption(2).innerText).contains('Follow @baz')
    .expect(getNthDialogOptionsOption(3).innerText).contains('Block @baz')
    .click(getNthDialogOptionsOption(3))
    .expect(accountProfileFollowedBy.innerText).match(/blocked/i)
    .expect(accountProfileFollowButton.getAttribute('aria-label')).eql('Unblock')
    .expect(accountProfileFollowButton.getAttribute('title')).eql('Unblock')
    .expect(accountProfileFollowButton.getAttribute('aria-pressed')).eql(undefined)
    .click(accountProfileFollowButton)
    .expect(accountProfileFollowedBy.innerText).contains('')
    .expect(accountProfileFollowButton.getAttribute('aria-label')).eql('Follow')
    .expect(accountProfileFollowButton.getAttribute('title')).eql('Follow')
    .expect(accountProfileFollowButton.getAttribute('aria-pressed')).eql('false')
    .click(accountProfileFollowButton)
    .expect(accountProfileFollowButton.getAttribute('aria-label')).eql('Follow')
    .expect(accountProfileFollowButton.getAttribute('title')).eql('Unfollow')
    .expect(accountProfileFollowButton.getAttribute('aria-pressed')).eql('true')
    .click(accountProfileFollowButton)
    .expect(accountProfileFollowButton.getAttribute('aria-label')).eql('Follow')
    .expect(accountProfileFollowButton.getAttribute('title')).eql('Follow')
    .expect(accountProfileFollowButton.getAttribute('aria-pressed')).eql('false')
})
