// const fs = require('fs-extra');
// const { RendererEvent } = require('typedoc/dist/lib/output/events');

// const MarkdownTheme = require('typedoc-plugin-markdown/dist/theme').default;

// import { Application } from 'typedoc';
// import { BitbucketTheme } from './theme';

import { writeFileSync } from 'fs';
import { RendererEvent, ReflectionKind } from 'typedoc';
import { MarkdownTheme } from 'typedoc-plugin-markdown';

/**
 *
 * @param {import('typedoc').Application} app
 */
export function load(app) {
    app.renderer.defineTheme('docsify', DocsifyTheme);
}

export class DocsifyTheme extends MarkdownTheme {
    /**
     *
     * @param {import('typedoc').Renderer} renderer
     */
    constructor(renderer) {
        super(renderer);
        this.listenTo(renderer, RendererEvent.END, this.writeSummary, 1024);
    }

    /**
     *
     * @param {string} reflectionId
     * @returns
     */
    toAnchorRef(reflectionId) {
        return 'markdown-header-' + reflectionId;
    }

    get mappings() {
        // return [];
        return [
            {
                kind: [ReflectionKind.Module],
                isLeaf: false,
                directory: 'modules',
                template: this.getReflectionTemplate(),
            },
            {
                kind: [ReflectionKind.Namespace],
                isLeaf: false,
                directory: 'modules',
                template: this.getReflectionTemplate(),
            },
        ];
    }

    /**
     *
     * @param {import('typedoc').Renderer} renderer
     */
    writeSummary(renderer) {
        const outputDirectory = renderer.outputDirectory;
        const summaryMarkdown = this.getSummaryMarkdown(renderer);
        try {
            writeFileSync(`${outputDirectory}/_sidebar.md`, summaryMarkdown);
            this.application.logger.info(
                `[typedoc-docsify] _sidebar.md written to ${outputDirectory}`
            );
        } catch (e) {
            this.application.logger.warn(
                `[typedoc-docsify] failed to write _sidebar at ${outputDirectory}`
            );
        }
    }

    getSummaryMarkdown(renderer) {
        const md = [];
        md.push('- Types Documentation');
        md.push('- [Summary](globals.md)');
        this.getNavigation(renderer.project).children.forEach(rootNavigation => {
            if (rootNavigation.children) {
                md.push(`  - ${rootNavigation.title}`);
                rootNavigation.children.forEach(item => {
                    md.push(`    - [${item.title}](${item.url})`);
                });
            }
        });
        return md.join('\n');
    }

    allowedDirectoryListings() {
        return [
            'README.md',
            'globals.md',
            'classes',
            'enums',
            'interfaces',
            'modules',
            'media',
            '.DS_Store',
            'SUMMARY.md',
        ];
    }
}
